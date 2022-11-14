import { useState, useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";
import * as SplashScreen from 'expo-splash-screen';
SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("bmiDB.db");
  return db;
}

const db = openDatabase();

function Items({ done: doneHeading, onPressItem }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select id, done, bmi, weight, height, date(itemDate) as itemDate from items where done = ? order by itemDate desc;`,
        [doneHeading ? 1 : 0],
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  const heading = "BMI History";

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {items.map(({ id, done, bmi, weight, height, itemDate }) => (
        <Text key={id} style={styles.history}>{itemDate}:  {bmi} (W:{weight}, H:{height})</Text>
      ))}
    </View>
  );
}

export default function App() {
  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
  const [bmi, setBmi] = useState(null);
  const [forceUpdate, forceUpdateId] = useForceUpdate();

  useEffect(() => {
    db.transaction((tx) => {
      //tx.executeSql(
      //  "drop table items;"
      //);
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, done int, bmi text, weight text, height text, itemDate real);"
      );
    });
  }, []);

  const add = (weight, height, bmi) => {
    // is weight empty?
    if (weight === null || weight === "") {
      return false;
    }

    // is weight empty?
    if (height === null || height === "") {
      return false;
    }

    bmi = ((weight / (height * height)) * 703).toFixed(1);

    db.transaction(
      (tx) => {
        tx.executeSql("insert into items (done, bmi, weight, height, itemDate) values (0, ?, ?, ?, julianday('now'))", [bmi, weight, height]);
        tx.executeSql("select * from items", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      },
      null
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.toolbar}>BMI Calculator</Text>

      {Platform.OS === "web" ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={styles.heading}>
            Expo SQlite is not supported on web!
          </Text>
        </View>
      ) : (
        <>
          <SafeAreaView style={styles.body}>
            <TextInput
              style={styles.input}
              onChangeText={(weight) => setWeight(weight)}
              placeholder="Weight in Pounds"
              value={weight}
            />
            <TextInput
              style={styles.input}
              onChangeText={(height) => setHeight(height)}
              placeholder="Height in Inches"              
              value={height}
            />
            <TouchableOpacity 
              onPress={() => {
                setBmi(((weight / (height * height)) * 703).toFixed(1));
                add(weight, height, bmi);
              }}
            >
              <Text style={styles.button}>Compute BMI</Text>
            </TouchableOpacity>
            <Text style={styles.result}>
              {bmi > 0 ? 'Body Mass Index is ' + bmi : ''}
            </Text>
            <Text style={styles.result2}>
              {(bmi > 0 && bmi < 18.5 ) ? '(Underweight)' : 
              (bmi >= 18.5 && bmi <= 24.9) ? '(Healthy)' :
              (bmi >= 25.0 && bmi <= 29.9) ? '(Overweight)' :
              (bmi > 29.9 ) ? '(Obese)' : ''}
            </Text>
          </SafeAreaView>
          <ScrollView style={styles.listArea}>
            <Items
              key={`forceupdate-todo-${forceUpdateId}`}
            />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Constants.statusBarHeight,
  },
  body: {
    flex: 1,
    padding: 5,
  },
  toolbar: {
    backgroundColor: '#f4511e',
    color: '#fff',
    textAlign: 'center',
    padding: 25,
    fontSize: 28,
    fontWeight: 'bold'
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    height: 40,
    padding: 10,
    marginBottom: 10,
    fontSize: 24,
  },
  button: {
    backgroundColor: '#34495e',
    color: '#fff',
    textAlign: 'center',
    padding: 10,
    borderRadius: 3,
    marginBottom: 30,
    fontSize: 24,
  },
  result: {
    paddingTop: 20,
    textAlign: 'center',
    fontSize: 28,
  },
  result2: {
    textAlign: 'center',
    fontSize: 28,
  },
  listArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 24,
    marginBottom: 8,
  },
  history: {
    fontSize: 20,
    marginBottom: 2,
  },
});

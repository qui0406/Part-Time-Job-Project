import { Image, StyleSheet, Platform, View, Text, TouchableOpacity } from 'react-native';
import Colors from './../constants/Colors'
import { useRouter } from 'expo-router';

export default function Index() {

  const router = useRouter();
  return (
    <View className='flex-1 items-center justify-center bg-white'>
      <View className='h-full rounded-tl-3xl rounded-tr-3xl pd-25' style={{ backgroundColor: Colors.PRIMARY }}>
        <Text className='mt-10 text-3xl font-bold text-center' style={{color: Colors.WHITE}}>Welcome Coaching Guru</Text>
        <Text style={{fontSize: 18, color: Colors.WHITE, margin: 10, textAlign: 'center'}}>Transform your ideas into engaging educational content, effortlessly with A!!!</Text>
        <View>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push('./Auth/Register')}>
            <Text style={styles.buttonText}>Get start!!!</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, {
            backgroundColor: Colors.PRIMARY,
            borderWidth: 1,
            borderColor: Colors.WHITE,
           
          }]} onPress={() => router.push('./Auth/Login')}>
            <Text style={[styles.buttonText, {color: Colors.WHITE}]}>Already an Acount!!!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.WHITE,
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  buttonText: {
    textAlign: 'center',
    color: Colors.PRIMARY,
    fontSize: 18,
    fontFamily: 'outfit-bold',
  }
  
})
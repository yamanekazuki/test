import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import { Reflection, ReflectionType } from './types';
import { saveReflection, getReflections, deleteReflection } from './storage';
import {
  HORIZONTAL_PROMPT,
  VERTICAL_PROMPT,
  HORIZONTAL_QUESTION,
  VERTICAL_QUESTION,
} from './prompts';

type Screen = 'home' | 'selectType' | 'write' | 'history';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [currentReflection, setCurrentReflection] = useState('');
  const [selectedType, setSelectedType] = useState<ReflectionType | null>(null);

  useEffect(() => {
    loadReflections();
  }, []);

  const loadReflections = async () => {
    const data = await getReflections();
    setReflections(data);
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getTypeLabel = (type: ReflectionType) => {
    return type === 'horizontal' ? '水平的' : '垂直的';
  };

  const handleSelectType = (type: ReflectionType) => {
    setSelectedType(type);
    setCurrentScreen('write');
  };

  const handleSaveReflection = async () => {
    if (currentReflection.trim() === '') {
      Alert.alert('エラー', '振り返りの内容を入力してください');
      return;
    }

    if (!selectedType) {
      Alert.alert('エラー', '振り返りのタイプが選択されていません');
      return;
    }

    const reflection: Reflection = {
      id: Date.now().toString(),
      date: getTodayDateString(),
      type: selectedType,
      content: currentReflection,
      createdAt: Date.now(),
    };

    try {
      await saveReflection(reflection);
      setCurrentReflection('');
      await loadReflections();
      Alert.alert('成功', '振り返りを保存しました', [
        { text: 'OK', onPress: () => setCurrentScreen('home') },
      ]);
    } catch (error) {
      Alert.alert('エラー', '保存に失敗しました');
    }
  };

  const handleCopyToChatGPT = async () => {
    if (currentReflection.trim() === '' || !selectedType) {
      Alert.alert('エラー', '振り返りの内容を入力してください');
      return;
    }

    const prompt = selectedType === 'horizontal' ? HORIZONTAL_PROMPT : VERTICAL_PROMPT;
    const textToCopy = prompt + currentReflection;

    await Clipboard.setStringAsync(textToCopy);
    Alert.alert('コピー完了', 'ChatGPTに貼り付けて分析してもらいましょう！');
  };

  const handleCopyToSpreadsheet = async () => {
    if (currentReflection.trim() === '' || !selectedType) {
      Alert.alert('エラー', '振り返りの内容を入力してください');
      return;
    }

    const today = getTodayDateString();
    const typeLabel = getTypeLabel(selectedType);

    // タブ区切り形式（Googleスプレッドシートに貼り付けやすい）
    const spreadsheetData = `${today}\t${typeLabel}\t${currentReflection}`;

    await Clipboard.setStringAsync(spreadsheetData);
    Alert.alert('コピー完了', 'スプレッドシートに貼り付けてください！');
  };

  const handleDeleteReflection = async (id: string) => {
    Alert.alert(
      '確認',
      'この振り返りを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReflection(id);
              await loadReflections();
            } catch (error) {
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const renderHomeScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>日々の振り返り</Text>
        <Text style={styles.date}>{getTodayDate()}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setCurrentScreen('selectType')}
        >
          <Text style={styles.primaryButtonText}>今日の振り返りを書く</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentScreen('history')}
        >
          <Text style={styles.secondaryButtonText}>過去の振り返りを見る</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          これまでの振り返り: {reflections.length}回
        </Text>
      </View>
    </View>
  );

  const renderSelectTypeScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>振り返りのタイプを選択</Text>
        <Text style={styles.date}>{getTodayDate()}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.typeButton, { backgroundColor: '#FF6B6B' }]}
          onPress={() => handleSelectType('horizontal')}
        >
          <Text style={styles.typeButtonTitle}>水平的な振り返り</Text>
          <Text style={styles.typeButtonDescription}>
            業務スキル・HR課題の振り返り
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, { backgroundColor: '#4ECDC4' }]}
          onPress={() => handleSelectType('vertical')}
        >
          <Text style={styles.typeButtonTitle}>垂直的な振り返り</Text>
          <Text style={styles.typeButtonDescription}>
            感情・内面の成長の振り返り
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentScreen('home')}
      >
        <Text style={styles.backButtonText}>ホームに戻る</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWriteScreen = () => {
    const question = selectedType === 'horizontal' ? HORIZONTAL_QUESTION : VERTICAL_QUESTION;
    const typeLabel = selectedType ? getTypeLabel(selectedType) : '';

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{typeLabel}な振り返り</Text>
          <Text style={styles.date}>{getTodayDate()}</Text>
        </View>

        <ScrollView style={styles.writeContainer}>
          <Text style={styles.promptText}>{question}</Text>

          <TextInput
            style={styles.textInput}
            multiline
            placeholder="ここに今日の振り返りを書いてください..."
            value={currentReflection}
            onChangeText={setCurrentReflection}
            textAlignVertical="top"
          />

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyToChatGPT}
            >
              <Text style={styles.copyButtonText}>ChatGPTで分析</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyToSpreadsheet}
            >
              <Text style={styles.copyButtonText}>スプレッドシートにコピー</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setCurrentReflection('');
                setSelectedType(null);
                setCurrentScreen('home');
              }}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveReflection}
            >
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderHistoryScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>過去の振り返り</Text>
      </View>

      <ScrollView style={styles.historyList}>
        {reflections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              まだ振り返りがありません。{'\n'}
              最初の振り返りを書いてみましょう！
            </Text>
          </View>
        ) : (
          reflections.map((reflection) => (
            <View key={reflection.id} style={styles.reflectionCard}>
              <View style={styles.reflectionHeader}>
                <View>
                  <Text style={styles.reflectionDate}>
                    {new Date(reflection.date).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </Text>
                  <Text style={styles.reflectionType}>
                    {getTypeLabel(reflection.type)}な振り返り
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteReflection(reflection.id)}
                >
                  <Text style={styles.deleteButton}>削除</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reflectionContent}>{reflection.content}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentScreen('home')}
      >
        <Text style={styles.backButtonText}>ホームに戻る</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {currentScreen === 'home' && renderHomeScreen()}
      {currentScreen === 'selectType' && renderSelectTypeScreen()}
      {currentScreen === 'write' && renderWriteScreen()}
      {currentScreen === 'history' && renderHistoryScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  typeButton: {
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeButtonTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  typeButtonDescription: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  statsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    color: '#666',
  },
  writeContainer: {
    flex: 1,
    padding: 20,
  },
  promptText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    minHeight: 200,
  },
  actionButtonsContainer: {
    marginBottom: 20,
  },
  copyButton: {
    backgroundColor: '#50C878',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyList: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  reflectionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reflectionDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  reflectionType: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reflectionContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reflection } from './types';

const STORAGE_KEY = '@daily_reflections';

export const saveReflection = async (reflection: Reflection): Promise<void> => {
  try {
    const existingData = await AsyncStorage.getItem(STORAGE_KEY);
    const reflections: Reflection[] = existingData ? JSON.parse(existingData) : [];

    // 既存の同じ日付の振り返りを削除
    const filteredReflections = reflections.filter(r => r.date !== reflection.date);

    // 新しい振り返りを追加
    filteredReflections.unshift(reflection);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredReflections));
  } catch (error) {
    console.error('振り返りの保存に失敗しました:', error);
    throw error;
  }
};

export const getReflections = async (): Promise<Reflection[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('振り返りの取得に失敗しました:', error);
    return [];
  }
};

export const deleteReflection = async (id: string): Promise<void> => {
  try {
    const existingData = await AsyncStorage.getItem(STORAGE_KEY);
    if (existingData) {
      const reflections: Reflection[] = JSON.parse(existingData);
      const filteredReflections = reflections.filter(r => r.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredReflections));
    }
  } catch (error) {
    console.error('振り返りの削除に失敗しました:', error);
    throw error;
  }
};

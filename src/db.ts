export interface FoodRecord {
  id: string;          // 唯一 UUID
  timestamp: number;   // 用餐时间戳
  foodName: string;    // 食物名称
  mealType: string;    // 食物名称 (改为 string 兼容自定义标签)
  price?: number;      // 价格
  rating: number;      // 1-5 评分
  isNewFood: boolean;  // 是否为新食物
  diningWith?: string; // 和谁吃
  location?: string;   // 在哪里吃
  isFavorited: boolean;// 是否收藏
  note: string;        // 备注日记
  imageBlob?: Blob;    // 抠图去背景后的透明 PNG 数据
}

const DB_NAME = 'EatSomethingGoodDB';
const DB_VERSION = 1;
const STORE_NAME = 'food_records';

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function addRecord(record: FoodRecord): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllRecords(): Promise<FoodRecord[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const records = request.result as FoodRecord[];
      // 按时间戳倒序排列
      records.sort((a, b) => b.timestamp - a.timestamp);
      resolve(records);
    };
    request.onerror = () => reject(request.error);
  });
}

export function toLocalYMD(timestamp: number | Date): string {
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${date}`;
}

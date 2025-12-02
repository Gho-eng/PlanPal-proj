export interface User {
  id?: number;
  email: string;
  username: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Expense {
  id?: number;
  userId: number;
  amount: number;
  category: string;
  description?: string;
  date?: Date;
}

export interface Goal {
  id?: number;
  userId: number;
  title: string;
  targetAmount: number;
  currentAmount?: number;
  deadline: Date;
}

export interface Category {
  id?: number;
  userId: number;
  name: string;
}
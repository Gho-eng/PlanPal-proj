export interface User {
    email:      string;
    username:   string;
    password:   string;
};

export interface UserLogin {
    email:      string;
    password:   string;
};

export interface Expense {
    name:       string;
    amount:     number;
    userId:     number;
    cat_id:     number;
};

export interface Category {
    id:         number;
    name:       string;
    desc:       string;
    userId:     number;
}
export interface Goal {
    id:         number;
    userId:     number;
    name:       string;
    desc:       string;
    targetAmount:  number;
    savedAmount: number;
};

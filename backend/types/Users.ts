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
    name:       string;
    desc:       string;
    userId:     number;
}
// export interface UserLogin {
//     email:      string;
//     password:   string;
// };

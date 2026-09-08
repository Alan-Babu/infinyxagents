export interface Division {
    id: string;
    name: string;
}

export interface Department {
    id: string;
    name: string;
    division_id: string;
}

export interface Section {
    id: string;
    name: string;
    department_id: string;
}

export interface Employee {
    id: string;
    full_name: string;
    email: string;
    department_id: string;
    role: string;
}

import { Injectable } from '@angular/core';
import { AssetIntelligenceApiBase } from './asset-intelligence-api-base';
import { Department, Division, Employee, Section } from '../models/org.models';

@Injectable({ providedIn: 'root' })
export class OrgApiService extends AssetIntelligenceApiBase {
    listDivisions(): Promise<Division[]> {
        return this.get<Division[]>('/org/divisions');
    }

    createDivision(name: string): Promise<Division> {
        return this.post<Division>('/org/divisions', { name });
    }

    deleteDivision(id: string): Promise<void> {
        return this.delete<void>(`/org/divisions/${id}`);
    }

    listDepartments(divisionId?: string): Promise<Department[]> {
        return this.get<Department[]>('/org/departments', { division_id: divisionId });
    }

    createDepartment(name: string, divisionId: string): Promise<Department> {
        return this.post<Department>('/org/departments', { name, division_id: divisionId });
    }

    deleteDepartment(id: string): Promise<void> {
        return this.delete<void>(`/org/departments/${id}`);
    }

    listSections(departmentId?: string): Promise<Section[]> {
        return this.get<Section[]>('/org/sections', { department_id: departmentId });
    }

    createSection(name: string, departmentId: string): Promise<Section> {
        return this.post<Section>('/org/sections', { name, department_id: departmentId });
    }

    deleteSection(id: string): Promise<void> {
        return this.delete<void>(`/org/sections/${id}`);
    }

    listEmployees(departmentId?: string): Promise<Employee[]> {
        return this.get<Employee[]>('/org/employees', { department_id: departmentId });
    }

    createEmployee(payload: { full_name: string; email: string; department_id: string; role?: string }): Promise<Employee> {
        return this.post<Employee>('/org/employees', payload);
    }

    updateEmployee(id: string, payload: Partial<Employee>): Promise<Employee> {
        return this.patch<Employee>(`/org/employees/${id}`, payload);
    }

    deleteEmployee(id: string): Promise<void> {
        return this.delete<void>(`/org/employees/${id}`);
    }
}

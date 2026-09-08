import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { DataTable } from '@nfinyx/data-table';
import type { ColDef } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Department, Division, Employee, Section } from '../../../models/org.models';
import { OrgApiService } from '../../../services/org-api.service';
import { PermissionsService } from '../../../services/permissions.service';

@Component({
    selector: 'lib-org-structure',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, DataTable, ButtonModule, InputTextModule, SelectModule],
    templateUrl: './org-structure.html',
})
export class OrgStructurePage implements OnInit {
    private readonly api = inject(OrgApiService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);
    readonly permissions = inject(PermissionsService);

    divisions: Division[] = [];
    departments: Department[] = [];
    sections: Section[] = [];
    employees: Employee[] = [];
    /** Full cross-division department list, used by the employee form's department select (separate from the cascading picker above). */
    allDepartments: Department[] = [];

    selectedDivisionId: string | null = null;
    selectedDepartmentId: string | null = null;

    newDivisionName = '';
    newDepartmentName = '';
    newSectionName = '';

    newEmployeeName = '';
    newEmployeeEmail = '';
    newEmployeeDepartmentId: string | null = null;

    employeeColDefs: ColDef[] = [];

    async ngOnInit(): Promise<void> {
        this.rebuildColDefs();
        this.divisions = await this.api.listDivisions();
        this.employees = await this.api.listEmployees();
        this.allDepartments = await this.api.listDepartments();
    }

    private rebuildColDefs(): void {
        const t = (key: string) => this.translate.instant(key);
        this.employeeColDefs = [
            { field: 'full_name', headerName: t('assetIntelligence.settings.org.name') },
            { field: 'email', headerName: t('assetIntelligence.settings.org.email') },
            { field: 'department_id', headerName: t('assetIntelligence.settings.org.department') },
            { field: 'role', headerName: t('assetIntelligence.settings.org.role') },
        ];
    }

    async selectDivision(division: Division): Promise<void> {
        this.selectedDivisionId = division.id;
        this.selectedDepartmentId = null;
        this.sections = [];
        this.departments = await this.api.listDepartments(division.id);
    }

    async selectDepartment(department: Department): Promise<void> {
        this.selectedDepartmentId = department.id;
        this.sections = await this.api.listSections(department.id);
    }

    async addDivision(): Promise<void> {
        const name = this.newDivisionName.trim();
        if (!name) return;
        try {
            const division = await this.api.createDivision(name);
            this.divisions = [...this.divisions, division];
            this.newDivisionName = '';
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async deleteDivision(division: Division): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('assetIntelligence.settings.org.confirmDeleteDivision', { name: division.name }),
            this.translate.instant('assetIntelligence.settings.org.divisions'),
            '',
            true,
        );
        if (!confirmed) return;
        try {
            await this.api.deleteDivision(division.id);
            this.divisions = this.divisions.filter(d => d.id !== division.id);
            if (this.selectedDivisionId === division.id) {
                this.selectedDivisionId = null;
                this.departments = [];
                this.sections = [];
            }
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async addDepartment(): Promise<void> {
        const name = this.newDepartmentName.trim();
        if (!name || !this.selectedDivisionId) return;
        try {
            const department = await this.api.createDepartment(name, this.selectedDivisionId);
            this.departments = [...this.departments, department];
            this.newDepartmentName = '';
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async deleteDepartment(department: Department): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('assetIntelligence.settings.org.confirmDeleteDepartment', { name: department.name }),
            this.translate.instant('assetIntelligence.settings.org.departments'),
            '',
            true,
        );
        if (!confirmed) return;
        try {
            await this.api.deleteDepartment(department.id);
            this.departments = this.departments.filter(d => d.id !== department.id);
            if (this.selectedDepartmentId === department.id) {
                this.selectedDepartmentId = null;
                this.sections = [];
            }
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async addSection(): Promise<void> {
        const name = this.newSectionName.trim();
        if (!name || !this.selectedDepartmentId) return;
        try {
            const section = await this.api.createSection(name, this.selectedDepartmentId);
            this.sections = [...this.sections, section];
            this.newSectionName = '';
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async deleteSection(section: Section): Promise<void> {
        const confirmed = await this.common.showConfirmationDialog(
            this.translate.instant('assetIntelligence.settings.org.confirmDeleteSection', { name: section.name }),
            this.translate.instant('assetIntelligence.settings.org.sections'),
            '',
            true,
        );
        if (!confirmed) return;
        try {
            await this.api.deleteSection(section.id);
            this.sections = this.sections.filter(s => s.id !== section.id);
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async addEmployee(): Promise<void> {
        const name = this.newEmployeeName.trim();
        const email = this.newEmployeeEmail.trim();
        if (!name || !email || !this.newEmployeeDepartmentId) return;
        try {
            const employee = await this.api.createEmployee({ full_name: name, email, department_id: this.newEmployeeDepartmentId });
            this.employees = [...this.employees, employee];
            this.newEmployeeName = '';
            this.newEmployeeEmail = '';
            this.newEmployeeDepartmentId = null;
        } catch (err) {
            this.common.showApiError(err);
        }
    }
}

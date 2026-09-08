import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonService } from '@nfinyx/services';
import { PageHeaderComponent } from '@nfinyx/page-header';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { EaCanvasComponent } from '../../components/ea-canvas/ea-canvas';
import { Application } from '../../models/ea.models';
import { DiagramEdge, DiagramLayoutUpdateItem, DiagramNode, EADiagram, EAElement } from '../../models/ea.models';
import { ApplicationApiService } from '../../services/application-api.service';
import { EaApiService } from '../../services/ea-api.service';
import { PermissionsService } from '../../services/permissions.service';

@Component({
    selector: 'lib-ea-modeler',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, PageHeaderComponent, ButtonModule, InputTextModule, SelectModule, EaCanvasComponent],
    templateUrl: './ea-modeler.html',
})
export class EaModelerPage implements OnInit {
    private readonly eaApi = inject(EaApiService);
    private readonly applicationApi = inject(ApplicationApiService);
    private readonly translate = inject(TranslateService);
    private readonly common = inject(CommonService);
    readonly permissions = inject(PermissionsService);
    private readonly router = inject(Router);

    loading = false;
    errorMessage = '';

    diagrams: EADiagram[] = [];
    selectedDiagramId: string | null = null;
    newDiagramName = '';

    elements: EAElement[] = [];
    applications: Application[] = [];
    selectedApplicationId: string | null = null;

    nodes: DiagramNode[] = [];
    edges: DiagramEdge[] = [];

    showAddCapability = false;
    newCapabilityName = '';
    newCapabilityParentId: string | null = null;

    async ngOnInit(): Promise<void> {
        await this.loadDiagrams();
        await this.loadElements();
        await this.loadApplications();
    }

    private async loadDiagrams(): Promise<void> {
        try {
            this.diagrams = await this.eaApi.listDiagrams();
            if (this.diagrams.length && !this.selectedDiagramId) {
                this.selectedDiagramId = this.diagrams[0].id;
                await this.loadLayout();
            }
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    private async loadElements(): Promise<void> {
        try {
            this.elements = await this.eaApi.listElements();
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    private async loadApplications(): Promise<void> {
        try {
            this.applications = await this.applicationApi.list();
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async onDiagramChange(): Promise<void> {
        await this.loadLayout();
    }

    private async loadLayout(): Promise<void> {
        if (!this.selectedDiagramId) return;
        this.loading = true;
        this.errorMessage = '';
        try {
            const layout = await this.eaApi.getDiagramLayout(this.selectedDiagramId);
            this.nodes = layout.nodes;
            this.edges = layout.edges;
        } catch (err) {
            this.common.showApiError(err);
            this.errorMessage = this.translate.instant('assetIntelligence.errors.loadFailed');
        } finally {
            this.loading = false;
        }
    }

    async createDiagram(): Promise<void> {
        const name = this.newDiagramName.trim();
        if (!name) return;
        try {
            const diagram = await this.eaApi.createDiagram({ name });
            this.newDiagramName = '';
            this.diagrams = [...this.diagrams, diagram];
            this.selectedDiagramId = diagram.id;
            await this.loadLayout();
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async createCapability(): Promise<void> {
        const name = this.newCapabilityName.trim();
        if (!name) return;
        try {
            const element = await this.eaApi.createElement({
                name,
                element_type: 'CAPABILITY',
                parent_id: this.newCapabilityParentId,
            });
            this.elements = [...this.elements, element];
            this.newCapabilityName = '';
            this.newCapabilityParentId = null;
            this.showAddCapability = false;
            if (this.selectedDiagramId) {
                const layout = await this.eaApi.addDiagramNode(this.selectedDiagramId, 'ELEMENT', element.id);
                this.nodes = layout.nodes;
                this.edges = layout.edges;
            }
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    async autoPopulate(): Promise<void> {
        if (!this.selectedDiagramId || !this.selectedApplicationId) return;
        this.loading = true;
        try {
            const layout = await this.eaApi.autoPopulateFromApplication(this.selectedDiagramId, this.selectedApplicationId);
            this.nodes = layout.nodes;
            this.edges = layout.edges;
        } catch (err) {
            this.common.showApiError(err);
        } finally {
            this.loading = false;
        }
    }

    async onLayoutChanged(items: DiagramLayoutUpdateItem[]): Promise<void> {
        if (!this.selectedDiagramId) return;
        try {
            await this.eaApi.saveDiagramLayout(this.selectedDiagramId, items);
        } catch (err) {
            this.common.showApiError(err);
        }
    }

    goToCapabilityMap(): void {
        this.router.navigate(['/asset-intelligence/capability-map']);
    }
}

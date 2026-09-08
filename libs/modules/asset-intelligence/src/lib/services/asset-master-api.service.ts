import { Injectable } from '@angular/core';
import { AssetIntelligenceApiBase } from './asset-intelligence-api-base';
import { AssetClass, Category, CategoryAttributeDef, Vendor } from '../models/asset-master.models';

@Injectable({ providedIn: 'root' })
export class AssetMasterApiService extends AssetIntelligenceApiBase {
    listCategories(): Promise<Category[]> {
        return this.get<Category[]>('/masters/categories');
    }

    createCategory(payload: { name: string; asset_class: AssetClass; default_useful_life_months: number }): Promise<Category> {
        return this.post<Category>('/masters/categories', payload);
    }

    updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
        return this.patch<Category>(`/masters/categories/${id}`, payload);
    }

    deleteCategory(id: string): Promise<void> {
        return this.delete<void>(`/masters/categories/${id}`);
    }

    getAttributeSchema(categoryId: string): Promise<CategoryAttributeDef[]> {
        return this.get<CategoryAttributeDef[]>(`/categories/${categoryId}/attributes`);
    }

    listVendors(): Promise<Vendor[]> {
        return this.get<Vendor[]>('/masters/vendors');
    }

    createVendor(payload: { name: string; contact_email: string; support_sla_hours?: number }): Promise<Vendor> {
        return this.post<Vendor>('/masters/vendors', payload);
    }

    updateVendor(id: string, payload: Partial<Vendor>): Promise<Vendor> {
        return this.patch<Vendor>(`/masters/vendors/${id}`, payload);
    }

    deleteVendor(id: string): Promise<void> {
        return this.delete<void>(`/masters/vendors/${id}`);
    }
}

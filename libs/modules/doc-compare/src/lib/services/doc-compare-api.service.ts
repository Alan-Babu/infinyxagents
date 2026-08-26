import { Injectable } from '@angular/core';
import { DocCompareApiBase } from './doc-compare-api-base';
import { ComparisonLogEntry, CompareResponse, HunkChoice, VersionDetail, VersionSummary } from '../models/doc-compare.models';

const DocCompareApiPaths = {
    compareRun: '/compare/run',
    compare: '/compare',
    versions: '/versions',
    history: '/history',
};

@Injectable({ providedIn: 'root' })
export class DocCompareApiService extends DocCompareApiBase {
    runCompare(opts: {
        uploadRefA?: string; uploadRefB?: string;
        versionAId?: string; versionBId?: string;
        labelA?: string; labelB?: string;
    }): Promise<CompareResponse> {
        const fd = new FormData();
        if (opts.uploadRefA) fd.append('upload_ref_a', opts.uploadRefA);
        if (opts.uploadRefB) fd.append('upload_ref_b', opts.uploadRefB);
        if (opts.versionAId) fd.append('version_a_id', opts.versionAId);
        if (opts.versionBId) fd.append('version_b_id', opts.versionBId);
        if (opts.labelA) fd.append('label_a', opts.labelA);
        if (opts.labelB) fd.append('label_b', opts.labelB);
        return this.postFormData<CompareResponse>(DocCompareApiPaths.compareRun, fd);
    }

    mergeComparison(
        comparisonId: string,
        selections: Record<string, HunkChoice>,
        label: string,
        tag: string,
        notes: string,
        setAsMaster: boolean,
    ): Promise<VersionSummary> {
        return this.post<VersionSummary>(`${DocCompareApiPaths.compare}/${comparisonId}/merge`, {
            selections, label, tag, notes, set_as_master: setAsMaster,
        });
    }

    saveVersion(
        uploadRef: string, label: string, tag: string, notes: string, setAsMaster: boolean,
    ): Promise<VersionSummary> {
        const fd = new FormData();
        fd.append('upload_ref', uploadRef);
        fd.append('label', label);
        fd.append('tag', tag);
        if (notes) fd.append('notes', notes);
        fd.append('set_as_master', String(setAsMaster));
        return this.postFormData<VersionSummary>(DocCompareApiPaths.versions, fd);
    }

    listVersions(): Promise<VersionSummary[]> {
        return this.get<VersionSummary[]>(DocCompareApiPaths.versions);
    }

    getVersion(id: string): Promise<VersionDetail> {
        return this.get<VersionDetail>(`${DocCompareApiPaths.versions}/${id}`);
    }

    async getMaster(): Promise<VersionDetail | null> {
        try {
            return await this.get<VersionDetail>(`${DocCompareApiPaths.versions}/master`);
        } catch {
            return null;
        }
    }

    setMaster(id: string): Promise<VersionSummary> {
        return this.patch<VersionSummary>(`${DocCompareApiPaths.versions}/${id}/master`, {});
    }

    deleteVersion(id: string): Promise<void> {
        return this.delete<void>(`${DocCompareApiPaths.versions}/${id}`);
    }

    listHistory(): Promise<ComparisonLogEntry[]> {
        return this.get<ComparisonLogEntry[]>(DocCompareApiPaths.history);
    }

    deleteHistoryEntry(id: string): Promise<void> {
        return this.delete<void>(`${DocCompareApiPaths.history}/${id}`);
    }
}

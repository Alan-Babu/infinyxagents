import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { DiagramEdge, DiagramLayoutUpdateItem, DiagramNode, EALayer } from '../../models/ea.models';

interface LayerPalette {
    fill: string;
    stroke: string;
    text: string;
}

const LAYER_COLORS: Record<EALayer, LayerPalette> = {
    BUSINESS: { fill: '#e0f2fe', stroke: '#0284c7', text: '#075985' },
    APPLICATION: { fill: '#dcfce7', stroke: '#16a34a', text: '#14532d' },
    TECHNOLOGY: { fill: '#fef3c7', stroke: '#d97706', text: '#78350f' },
};

const VIEWBOX_WIDTH = 1200;
const VIEWBOX_HEIGHT = 640;

/**
 * Hand-rolled SVG diagram canvas, ported from the legacy asset-mgmt EA Modeler.
 * No diagramming library exists in this repo; this stays self-contained raw
 * SVG + pointer-drag, per the agreed approach, restyled with Tailwind hues.
 */
@Component({
    selector: 'lib-ea-canvas',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ea-canvas.html',
})
export class EaCanvasComponent implements OnChanges {
    @Input({ required: true }) nodes: DiagramNode[] = [];
    @Input({ required: true }) edges: DiagramEdge[] = [];
    @Output() layoutChanged = new EventEmitter<DiagramLayoutUpdateItem[]>();

    @ViewChild('svg') svgRef?: ElementRef<SVGSVGElement>;

    readonly viewBoxWidth = VIEWBOX_WIDTH;
    readonly viewBoxHeight = VIEWBOX_HEIGHT;

    localNodes: DiagramNode[] = [];
    private draggingKey: string | null = null;
    private dragOffset = { x: 0, y: 0 };

    ngOnChanges(): void {
        this.localNodes = this.nodes.map(n => ({ ...n }));
    }

    palette(layer: EALayer): LayerPalette {
        return LAYER_COLORS[layer];
    }

    nodeByKey(key: string): DiagramNode | undefined {
        return this.localNodes.find(n => n.node_key === key);
    }

    edgeIsDashed(edge: DiagramEdge): boolean {
        return edge.kind === 'DEPENDS_ON';
    }

    edgeMidpoint(edge: DiagramEdge): { x: number; y: number } {
        const source = this.nodeByKey(edge.source_key);
        const target = this.nodeByKey(edge.target_key);
        if (!source || !target) return { x: 0, y: 0 };
        return {
            x: (source.x + source.width / 2 + target.x + target.width / 2) / 2,
            y: (source.y + source.height / 2 + target.y + target.height / 2) / 2,
        };
    }

    edgeLine(edge: DiagramEdge): { x1: number; y1: number; x2: number; y2: number } | null {
        const source = this.nodeByKey(edge.source_key);
        const target = this.nodeByKey(edge.target_key);
        if (!source || !target) return null;
        return {
            x1: source.x + source.width / 2,
            y1: source.y + source.height / 2,
            x2: target.x + target.width / 2,
            y2: target.y + target.height / 2,
        };
    }

    private toSvgPoint(event: PointerEvent): { x: number; y: number } {
        const svg = this.svgRef?.nativeElement;
        if (!svg) return { x: 0, y: 0 };
        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) return { x: 0, y: 0 };
        const transformed = point.matrixTransform(ctm.inverse());
        return { x: transformed.x, y: transformed.y };
    }

    onNodePointerDown(event: PointerEvent, node: DiagramNode): void {
        event.preventDefault();
        (event.target as Element).setPointerCapture(event.pointerId);
        const svgPoint = this.toSvgPoint(event);
        this.draggingKey = node.node_key;
        this.dragOffset = { x: svgPoint.x - node.x, y: svgPoint.y - node.y };
    }

    onPointerMove(event: PointerEvent): void {
        if (!this.draggingKey) return;
        const svgPoint = this.toSvgPoint(event);
        const node = this.nodeByKey(this.draggingKey);
        if (!node) return;
        node.x = Math.max(0, Math.min(this.viewBoxWidth - node.width, svgPoint.x - this.dragOffset.x));
        node.y = Math.max(0, Math.min(this.viewBoxHeight - node.height, svgPoint.y - this.dragOffset.y));
    }

    onPointerUp(): void {
        if (!this.draggingKey) return;
        this.draggingKey = null;
        this.layoutChanged.emit(
            this.localNodes.map(n => ({ node_key: n.node_key, x: n.x, y: n.y, width: n.width, height: n.height })),
        );
    }
}

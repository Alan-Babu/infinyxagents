import { Component } from '@angular/core';
import { AgentsLanding, AGENT_TILES } from '@nfinyx/agents-landing';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [AgentsLanding],
    template: `<lib-agents-landing [tiles]="tiles" />`,
})
export class Dashboard {
    readonly tiles = AGENT_TILES;
}

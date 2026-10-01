import { Component, computed, inject } from '@angular/core';
import { AgentsLanding, AGENT_TILES } from '@nfinyx/agents-landing';
import { AgentGroupsService, AuthService } from '@nfinyx/services';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [AgentsLanding],
    template: `<lib-agents-landing [tiles]="tiles()" [departments]="groups.departments()" />`,
})
export class Dashboard {
    private readonly auth = inject(AuthService);
    protected readonly groups = inject(AgentGroupsService);

    /** Only the agents the user's role includes (all of them unless `enforceAgentAccess` is on). */
    readonly tiles = computed(() => AGENT_TILES.filter(tile => tile.disabled || this.auth.canOpenAgent(tile.id)));
}

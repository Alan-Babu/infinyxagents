import { describe, expect, it } from 'vitest';

import { MyTasksPage } from './my-tasks';
import type { Task } from '../../models/executive-summary.models';

function task(id: number, createdBy: string, assignees: string[]): Task {
  return {
    id,
    title: `Task ${id}`,
    assignees,
    created_by: createdBy,
    priority: 'Medium',
    importance: 'Medium',
    status: 'open',
    created_at: '2026-09-03T08:00:00Z',
  };
}

describe('MyTasksPage identity matching', () => {
  it('matches assignee ID, display name, and email aliases without substrings', () => {
    const page = Object.create(MyTasksPage.prototype) as MyTasksPage;
    Object.assign(page, {
      auth: {
        user: () => ({
          id: ' Employee-42 ',
          displayName: 'Aisha Example',
          email: 'aisha@example.test',
        }),
      },
      tasks: [
        task(1, 'other', ['employee-42']),
        task(2, 'other', ['Assignee: AISHA EXAMPLE']),
        task(3, 'other', ['email:aisha@example.test']),
        task(4, 'other', ['not-employee-42']),
      ],
    });

    expect(page.toMe.map(item => item.id)).toEqual([1, 2, 3]);
  });

  it('keeps canonical creator ID matching and tolerates historical display names', () => {
    const page = Object.create(MyTasksPage.prototype) as MyTasksPage;
    Object.assign(page, {
      auth: {
        user: () => ({
          id: 'employee-42',
          displayName: 'Aisha Example',
          email: 'aisha@example.test',
        }),
      },
      tasks: [
        task(1, 'employee-42', ['other']),
        task(2, 'Created by: Aisha Example', ['other']),
        task(3, 'employee-420', ['other']),
      ],
    });

    expect(page.byMe.map(item => item.id)).toEqual([1, 2]);
  });
});

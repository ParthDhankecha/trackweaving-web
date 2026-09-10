import { Component, Input } from '@angular/core';


@Component({
    selector: 'app-priority-actions',
    imports: [],
    templateUrl: './priority-actions.html',
    styleUrl: './priority-actions.scss'
})
export class PriorityActions {
    @Input({ required: true }) recommendations: string[] = [];
}

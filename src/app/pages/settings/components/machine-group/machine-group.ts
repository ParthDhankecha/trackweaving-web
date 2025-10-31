import { Component, inject } from '@angular/core';

import { UpsertMachineGroup } from './upsert-machine-group/upsert-machine-group';

import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { IResponse } from '@src/app/models/http-response.model';


@Component({
  selector: 'app-machine-group',
  imports: [
    UpsertMachineGroup
  ],
  templateUrl: './machine-group.html',
  styleUrl: './machine-group.scss'
})
export class MachineGroup {
  // Inject Services
  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);

  protected upsertMachineGroupModalData: any;
  protected isUpsertMachineGroupModalOpen: boolean = false;



  ngOnInit(): void {
    this.loadList();
  }


  protected machineGroupList: any[] = [];
  private loadList(): void {
    this._apiFs.machineGroup.list().subscribe({
      next: (res: IResponse) => {
        if (res.code === 'OK') {
          this.machineGroupList = res.data || [];
        }
      },
      error: (err: any) => { }
    });
  }



  protected onOpenUpsertWorkspaceModal(machineGroup: any = null): void {
    this.upsertMachineGroupModalData = machineGroup;
    this.isUpsertMachineGroupModalOpen = true;
  }

  protected onCloseMachineGroupModal(): void {
    this.isUpsertMachineGroupModalOpen = false;
  }

  protected upsertMachineGroupModalEvent(data: any): void {
    const index = data ? this.machineGroupList.findIndex(mg => mg._id === data._id) : -1;
    if (index > -1) {
      // Update existing workspace in the list
      this.machineGroupList[index] = data;
    } else {
      this.loadList();
    }
    this.onCloseMachineGroupModal();
  }
}
/**
 * Created by u6008750 on 5/12/2017.
 */
import 'rxjs/add/operator/switchMap';
import {Component, OnInit,ViewChild} from "@angular/core";
import {ExperimentsService} from "../experiments.service";
import { ActivatedRoute} from '@angular/router'

import {TabsStatusEvent,TabContainer} from "../../util/tabs/"

@Component({
    selector: "experiment-detail",
    template: `
<div>

   <a *ngIf="visStr"(click)="changeState()">
     {{visStr}}
  </a>
  <tab-container [componentNames]="cNames"
                    (tabStatusChanged)="changeStatus($event)"
                    [state]="state">
  </tab-container>

  

  <div *ngIf="checkIfNewState()">

    <button (click)="previous()" class="btn btn-primary" type="button">
                        Previous
    </button>
    <button (click)="next()"
            class="btn btn-primary"
            type="button" 
            [disabled]="buttonDisabled">
            Next
    </button>

  </div>

</div>
    `


})

export class ExperimentDetail implements OnInit {

    experiment: any;
    cNames: Array<string>;
    data: Array<string>;
    state:string = TabContainer.VIEW;
    buttonDisabled: boolean = true;
    @ViewChild(TabContainer) theTabs: TabContainer
    private visStr:string = "Edit";
    viewSize:number = -1;



    constructor(private experimentsService: ExperimentsService,private route:ActivatedRoute) {
        this.cNames = ["PrepTab","TestComponent","DescriptionTab"]
    }

    changeStatus($event:TabsStatusEvent){
        this.buttonDisabled = !($event.currentStatus);
    }

    changeState(){
        if(this.state === TabContainer.VIEW )
        {
            this.visStr= "View";
            this.state = TabContainer.EDIT;
        }
        else{
            this.visStr = "Edit";
            this.state = TabContainer.VIEW;
        }
    }
    ngOnInit(): void {
        this.route.data.forEach((data) =>{
            this.experiment = data['experiment']; // this data is carried on route look at browse-experiments.component.ts
                                                 // & experiment-resolver.service.ts
            console.log(this.experiment);
        });
    }
    next(){
        this.theTabs.select(this.theTabs.activeId + 1);

    }
    previous(){
        this.theTabs.select(this.theTabs.activeId - 1);

    }
    checkIfNewState():boolean{
        return (TabContainer.NEW === this.state)
    }



}
import {Component, OnDestroy, OnInit} from "@angular/core";
import {FormBuilder, FormGroup} from "@angular/forms";
import {ConstantsService} from "../../services/constants.service";
import {GridApi} from "ag-grid-community";
import {ExperimentPlatformService} from "../../services/experiment-platform.service";
import {CheckboxRenderer} from "../../util/grid-renderers/checkbox.renderer";
import {GnomexService} from "../../services/gnomex.service";
import {DictionaryService} from "../../services/dictionary.service";
import {MatDialogConfig} from "@angular/material";
import {SampleTypeDetailDialogComponent} from "./sample-type-detail-dialog.component";
import {SelectEditor} from "../../util/grid-editors/select.editor";
import {Subscription} from "rxjs";
import {DialogsService, DialogType} from "../../util/popup/dialogs.service";
import {ActionType} from "../../util/interfaces/generic-dialog-action.model";

//assets/page_add.png

@Component({
    template: `
        <div class="full-height full-width flex-container-col">
            <div class="flex-grow flex-container-row align-center">
                <button type="button" mat-button color="primary" (click)="select()" [disabled]="sampleTypeRowData.length === 0">
                    {{selectedState}}
                </button>
                <button mat-button color="primary"
                        type="button"
                        (click)="addSampleType()">
                    <img [src]="this.constService.ICON_ADD"> Add
                </button>
                <button [disabled]="selectedSampleTypeRows.length === 0"
                        (click)="removeSampleType()"
                        mat-button color="primary"
                        type="button">
                    <img [src]="this.constService.ICON_DELETE"> Remove
                </button>
                <button mat-button
                        color="primary"
                        (click)="openSampleTypeEditor()"
                        [disabled]="selectedSampleTypeRows.length === 0"
                        type="button"> Edit Notes </button>
                <mat-checkbox (change)="filterOptions($event)" [(ngModel)]="showInactive">Show Inactive</mat-checkbox>

            </div>
            <div style="flex:9" class="full-width">
                <ag-grid-angular class="full-height full-width ag-theme-fresh"
                                 [context]="context"
                                 [columnDefs]="columnDefs"
                                 (cellValueChanged)="onCellValueChanged($event)"
                                 [rowData]="this.sampleTypeRowData"
                                 (gridReady)="onGridReady($event)"
                                 (gridSizeChanged)="onGridSizeChanged($event)"
                                 [rowDeselection]="true"
                                 [rowSelection]="'single'"
                                 (rowSelected)="this.onSampleTypeRowSelected($event)"
                                 [stopEditingWhenGridLosesFocus]="true">
                </ag-grid-angular>

            </div>
            


        </div>
    `,
    styles:[`
        .no-padding-dialog .mat-dialog-container {
            padding: 0;
        }
    `]
})

export class EpSampleTypeTabComponent implements OnInit, OnDestroy {
    public formGroup:FormGroup;
    public showInactive: boolean = false;
    private expPlatformSubscription: Subscription;
    public selectedState:string = "Select all";
    public currentSelectedIndex:number = -1;
    public selectedSampleTypeRows:any[] = [];
    private gridApi:GridApi;
    private sampleTypeListAll: any[];
    private sampleTypeList: any[];
    private _nucleotideTypeDataProvider:any[];
    public context;
    private expPlatformNode: any;



    public sampleTypeRowData:any[] = [];
    get nucleotideTypeDataProvider():any[]{
        if(!this._nucleotideTypeDataProvider){
            this._nucleotideTypeDataProvider = this.dictionaryService.getEntries(DictionaryService.NUCLEOTIDE_TYPE);
            this._nucleotideTypeDataProvider.splice(0,1);
        }
        return this._nucleotideTypeDataProvider;
    }
    private parseSortOrder(params){
        if(Number.isNaN(Number.parseInt(params.newValue))){
            return '';
        }
        let newVal:number = +params.newValue;
        if(newVal < 0 || newVal > 99){
            return '';
        }
        return params.newValue;
    }
    private applySampleTypeNotesFn = (dirty:boolean) => {
        if(dirty){
            this.expPlatfromService.findExpPlatformFormMember(this.constructor.name).markAsDirty();
        }

    };


    private sortSampleTypefn = (obj1,obj2) => {
        if (obj1 == null && obj2 == null) {
            return 0;
        } else if (obj1 == null) {
            return 1;
        } else if (obj2 == null) {
            return -1;
        } else {
            let c1:string = obj1.codeNucleotideType;
            let c2:string = obj2.codeNucleotideType;
            if (c1 < c2) {
                return -1;
            } else if (c1 > c2) {
                return 1;
            } else {
                let s1:number = +obj1.sortOrder;
                let s2:number = +obj2.sortOrder;
                if (s1 < s2) {
                    return -1;
                } else if (s1 > s2) {
                    return 1;
                } else {
                    let n1:string = obj1.display;
                    let n2:string = obj2.display;
                    if (n1 < n2) {
                        return -1;
                    } else if (n1 > n2) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            }
        }

    };


    public columnDefs=[
        {
            headerName: "Active",
            field: "isSelected",
            cellRendererFramework: CheckboxRenderer,
            checkboxEditable: true,
            editable: false,
            width: 100
        },
        {
            headerName: "Sample Type",
            field: "display",
            editable: true,
            width: 300
        },
        {
            headerName: "Sample Category",
            field: "codeNucleotideType",
            cellEditorFramework: SelectEditor,
            selectOptions: this.nucleotideTypeDataProvider,
            selectOptionsDisplayField: "display",
            selectOptionsValueField: "codeNucleotideType",
            editable: true,
            width:300
        },
        {
            headerName: "Sort Order",
            field: "sortOrder",
            valueParser: this.parseSortOrder,
            editable:true,
            width: 100
        }

    ];

    constructor(private fb: FormBuilder,
                private constService: ConstantsService,
                private expPlatfromService: ExperimentPlatformService,
                private gnomexService: GnomexService,
                private dictionaryService: DictionaryService,
                private dialogsService: DialogsService) {
        this.context = {componentParent: this};

    }

    ngOnInit(){
        this.formGroup = this.fb.group({sampleTypes:[]});
        this.expPlatformSubscription = this.expPlatfromService.getExperimentPlatformObservable()
            .subscribe(resp =>{
                if(resp.sampleTypes && !resp.message) {
                    this.expPlatformNode = resp;
                    this.sampleTypeListAll = Array.isArray(resp.sampleTypes) ? resp.sampleTypes : [resp.sampleTypes.SampleType];
                    this.sampleTypeList = this.sampleTypeListAll.filter((samType: any) => (samType.isActive === "Y")).sort(this.sortSampleTypefn);
                    this.showInactive = false;
                    this.filterOptions();
                    this.formGroup.get('sampleTypes').setValue(this.sampleTypeList);
                   this.formGroup.markAsPristine();

                }
            });

    }

    filterOptions(event?: any) {
        // This is to filter the data that is executive(selected), but not to filter the data that is active in database.
        if(this.showInactive) {
            this.sampleTypeRowData = this.sampleTypeList;
        } else {
            this.sampleTypeRowData = this.sampleTypeList.filter((samType: any) => (samType.isSelected === "Y"));
        }
    }

    onGridReady(params:any){
        this.gridApi= params.api;
    }


    select(){
        if( this.selectedState ===  "Select all"){
            this.selectedState = "Unselect all";
            this.sampleTypeRowData.map(type => {
                type.isSelected = "Y";
                return type;
            });

        }else{
            this.selectedState = "Select all";
            this.sampleTypeRowData.map(type => {
                type.isSelected = "N";
                return type;
            });
        }
        this.filterOptions();
        this.gridApi.setRowData(this.sampleTypeRowData);
        this.expPlatfromService.findExpPlatformFormMember(this.constructor.name).markAsDirty();
        if(this.sampleTypeRowData.length === 0 && !this.showInactive) {
            this.dialogsService.alert("Check Show Inactive box to see all inactive data.", null, DialogType.INFO);
        }

    }

    addSampleType(){
        if(this.expPlatformNode){
            let newSampleType = {
                isSelected:'Y',
                idSampleType:'SampleType',
                display:'enter sample type here...',
                isActive: 'Y',
                codeNucleotideType: 'DNA',
                sortOrder: '99',
                notes:'',
                idCoreFacility: this.expPlatformNode.idCoreFacility
            };
            this.sampleTypeList.splice(0, 0, newSampleType);
            this.filterOptions();
            this.gridApi.setRowData(this.sampleTypeRowData);
            this.gridApi.forEachNode(node => node.rowIndex ? 0 : node.setSelected(true, true));
            this.expPlatfromService.findExpPlatformFormMember(this.constructor.name).markAsDirty();

        }

    }

    removeSampleType(){
        let removeIndex = this.sampleTypeList.indexOf(this.selectedSampleTypeRows[0]);
        if(removeIndex > -1){
            this.sampleTypeList.splice(removeIndex, 1);
            this.filterOptions();
            this.gridApi.setRowData(this.sampleTypeRowData);
            this.expPlatfromService.findExpPlatformFormMember(this.constructor.name).markAsDirty();
            this.selectedSampleTypeRows = [];
        }

    }


    openSampleTypeEditor() {
        let config: MatDialogConfig = new MatDialogConfig();
        config.data = {
            rowData: this.selectedSampleTypeRows.length > 0 ? this.selectedSampleTypeRows[0] : null,
            applyFn: this.applySampleTypeNotesFn
        };
        config.width = "60em";

        this.dialogsService.genericDialogContainer(SampleTypeDetailDialogComponent, null, null, config,
            {actions: [
                    {type: ActionType.PRIMARY, icon: this.constService.ICON_SAVE, name: "Apply", internalAction: "applyChanges"},
                    {type: ActionType.SECONDARY, name: "Cancel", internalAction: "onClose"}
                ]});

    }

    onSampleTypeRowSelected(event:any){
        if(event.node.selected){
            this.currentSelectedIndex = event.rowIndex;
            this.gridApi.selectIndex(this.currentSelectedIndex, false, null);
        }
        this.selectedSampleTypeRows = this.gridApi.getSelectedRows();
    }
    onGridSizeChanged(event){
        if(this.gridApi){
            this.gridApi.sizeColumnsToFit();
        }
    }
    onCellValueChanged(event):void {
            if(event.oldValue !== event.newValue){
                this.formGroup.markAsDirty();
            }

    }

    externallyResizeGrid(){
        if(this.gridApi){
            this.gridApi.sizeColumnsToFit();
        }
    }

    ngOnDestroy(){
        this.expPlatformSubscription.unsubscribe();
    }


}

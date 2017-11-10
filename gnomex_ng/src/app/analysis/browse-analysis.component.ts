/*
 * Copyright (c) 2016 Huntsman Cancer Institute at the University of Utah, Confidential and Proprietary
 */
import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from "@angular/core";

import { URLSearchParams } from "@angular/http";

import { jqxWindowComponent } from "jqwidgets-framework";
import { jqxButtonComponent } from "jqwidgets-framework";
import { jqxComboBoxComponent } from "jqwidgets-framework";
import { jqxNotificationComponent  } from "jqwidgets-framework";
import { jqxCheckBoxComponent } from "jqwidgets-framework";
import {
    TreeComponent, ITreeOptions, TreeNode, TreeModel, IActionMapping,
    TREE_ACTIONS
} from "angular-tree-component";
import * as _ from "lodash";
import {Subscription} from "rxjs/Subscription";
import {Router} from "@angular/router";
import {AnalysisService} from "../services/analysis.service";
import {MatDialogRef, MatDialog} from '@angular/material';
import {DeleteAnalysisComponent} from "./delete-analysis.component";
import {ITreeNode} from "angular-tree-component/dist/defs/api";
import {DragDropHintComponent} from "./drag-drop-hint.component";
import {LabListService} from "../services/lab-list.service";
import {CreateAnalysisComponent} from "./create-analysis.component";
import {CreateAnalysisGroupComponent} from "./create-analysis-group.component";
import {CreateSecurityAdvisorService} from "../services/create-security-advisor.service";

const actionMapping:IActionMapping = {
    mouse: {
        click: (tree, node, $event) => {
            $event.ctrlKey
                ? TREE_ACTIONS.TOGGLE_SELECTED_MULTI(tree, node, $event)
                : TREE_ACTIONS.TOGGLE_SELECTED(tree, node, $event)
        }
    }
};

@Component({
    selector: "analysis",
    templateUrl: "./analysis.component.html",
    styles: [`
        .inlineComboBox {
            display: inline-block;
        }

        .hintLink {
            fontSize: 9;
            paddingLeft: 1;
            paddingRight: 1;
            paddingBottom: 1;
            paddingTop: 1;
        }

        .sidebar {
            width: 25%;
            position: relative;
            left: 0;
            background-color: #ccc;
            transition: all .25s;
        }

        .flex-column-container {
            display: flex;
            flex-direction: column;
            background-color: white;
            height: 100%;
        }

        .flex-row-container {
            display: flex;
            flex-direction: row;
        }

        .br-exp-row-one {
            flex-grow: 1;
        }

        .br-exp-item-row-two {
            flex-grow: 1;
            position: relative;
        }

        .br-exp-item {
            flex: 1 1 auto;
            font-size: small;
        }

        .br-exp-one {
            width: 100%;
            flex-grow: .25;

        }

        .br-exp-help-drag-drop {
            width: 100%;
            flex-grow: .10;
        }

        .br-exp-three {
            width: 100%;
            height: 6em;
            flex-grow: 8;
        }

        .br-exp-four {
            width: 100%;
            flex-grow: .10;
        }

        .br-exp-five {
            width: 100%;            
            flex-grow: .10;
        }

        .t {
            display: table;
            width: 100%;
        }

        .tr {
            display: table-row;
            width: 100%;
        }

        .td {
            display: table-cell;
        }

        .jqx-tree {
            height: 100%;
        }

        .jqx-notification {
            margin-top: 30em;
            margin-left: 20em;
        }

        div.background {
            width: 100%;
            height: 100%;
            background-color: #EEEEEE;
            padding: 0.3em;
            border-radius: 0.3em;
            border: 1px solid darkgrey;
            display: flex;
            flex-direction: column;
        }
        .experiment-detail-panel {
            width:75%;
            padding: 2em;
            margin-left: 2em;
            background-color: #0b97c4;
            border: #C8C8C8 solid thin;
            overflow: auto;
        }
    `]
})

export class BrowseAnalysisComponent implements OnInit, OnDestroy, AfterViewInit {

    @ViewChild("analysisTree") treeComponent: TreeComponent;
    @ViewChild("labComboBox") labComboBox: jqxComboBoxComponent;

    private treeModel: TreeModel;
    /*
    angular2-tree options
     */
    public options: ITreeOptions = {
        displayField: "label",
        childrenField: "items",
        useVirtualScroll: true,
        nodeHeight: 22,
        nodeClass: (node: TreeNode) => {
            return "icon-" + node.data.icon;
        },
        allowDrop: (element, {parent, index}) => {
            this.dragEndItems = _.cloneDeep(this.items);
            if (parent.data.parentid === -1) {
                return false;
            } else {
                return true;
            }
        },

        allowDrag: (node) => node.isLeaf,
        actionMapping
    };

    public items: any;
    public labs: any;
    public currentItem: any;
    public targetItem: any;

    public labMembers: any;
    private billingAccounts: any;
    private dragEndItems: any;
    private selectedItem: ITreeNode;
    private selectedIndex: number = -1;
    private selectedAnalysisGroupLabItem: any;
    private selectedAnalysisGroupLabIndex: number = -1;
    private idCoreFacility: string = "3";

    public analysisCount: number;
    private analysisGroupListSubscription: Subscription;
    public deleteAnalysisDialogRef: MatDialogRef<DeleteAnalysisComponent>;
    private labList: any[] = [];
    private labListString: any[] = [];
    private selectedIdLab;
    public disabled: boolean = true;
    public disableNewAnalysis: boolean = true;
    public disableDelete: boolean = true;
    public disableNewAnalysisGroup: boolean = true;
    private selectedLabLabel: string;

    ngOnInit() {
        this.treeModel = this.treeComponent.treeModel;
        this.router.navigate(['/analysis', {outlets: {'browsePanel': 'overview'}}]);
        this.labListService.getLabList().subscribe((response: any[]) => {
            this.labList = response;
        });
    }

    ngAfterViewInit() {
    }

    constructor(private analysisService: AnalysisService, private router: Router,
                private dialog: MatDialog,
                private labListService: LabListService,
                private createSecurityAdvisorService: CreateSecurityAdvisorService) {


        this.items = [];
        this.dragEndItems = [];
        this.labMembers = [];
        this.billingAccounts = [];
        this.labs = [];


        this.analysisGroupListSubscription = this.analysisService.getAnalysisGroupListObservable().subscribe(response => {
            this.buildTree(response);
            setTimeout(_ => {
                this.treeModel.expandAll();
            })
        });

    }

    go(event: any) {
        console.log("event " + event);
    }

    /*
    Build the tree data
    @param
     */
    buildTree(response: any[]) {
        this.analysisCount = 0;
        this.labs = [];
        if (!this.isArray(response)) {
            this.items = [response];
        } else {
            this.items = response;
        }
        this.labs = this.labs.concat(this.items);
        for (var l of this.items) {
            if (!this.isArray(l.AnalysisGroup)) {
                l.items = [l.AnalysisGroup];
            } else {
                l.items = l.AnalysisGroup;
            }
            l.id = l.idLab;
            l.parentid = -1;

            l.icon = "assets/group.png";
            for (var p of l.items) {
                p.icon = "assets/folder.png";
                p.labId = l.labId;
                p.id = p.idAnalysis;
                p.parentid = l.id;
                if (p.Analysis) {
                    if (!this.isArray(p.Analysis)) {
                        p.items = [p.Analysis];
                    } else {
                        p.items = p.Analysis;
                    }
                    for (var a of p.items) {
                        if (a) {
                            if (a.label) {
                                this.analysisCount++;
                                var labelString: string = a.number;
                                labelString = labelString.concat(" (");
                                labelString = labelString.concat(a.label);
                                labelString = labelString.concat(")");
                                a.label = labelString;
                                a.id = a.idAnalysis;
                                a.icon = "assets/map.png";
                                a.parentid = p.id;
                                if (this.analysisCount % 100 === 0) {
                                    console.log("experiment count " + this.analysisCount);
                                }
                            } else {
                                console.log("label not defined");
                            }
                        } else {
                            console.log("a is undefined");
                        }
                    }
                }
            }
        }
    };

    /*

    Start of Ng2 tree
     */

    onMoveNode($event) {
        console.log(
            "Moved",
            $event.node.name,
            "to",
            $event.to.parent.name,
            "at index",
            $event.to.index);
        this.currentItem = $event.node;
        this.targetItem = $event.to.parent;
        this.doMove($event);
    }

    /*
        Determine if the object is an array
        @param what
     */
    isArray(what) {
        return Object.prototype.toString.call(what) === "[object Array]";
    };

    detailFn(): (keywords: string) => void {
        return (keywords) => {
            window.location.href = "http://localhost/gnomex/analysis/" + keywords;
        };
    }

    /**
     * Perform the move
     * @param event
     */
    doMove(event: any) {

        var params: URLSearchParams = new URLSearchParams();
        params.set("idLab", event.to.parent.idLab);
        var analysisGroupXMLString: string = "";
        var idAnalysisString: string = "";
        for (let n of event.treeModel.activeNodes) {
            idAnalysisString = idAnalysisString.concat(n.data.idAnalysis);
            idAnalysisString = idAnalysisString.concat(",");
        }
        analysisGroupXMLString = analysisGroupXMLString.concat('<analysisGroups><AnalysisGroup idAnalysisGroup=');
        analysisGroupXMLString = analysisGroupXMLString.concat('"');

        analysisGroupXMLString = analysisGroupXMLString.concat(event.to.parent.idAnalysisGroup);
        analysisGroupXMLString = analysisGroupXMLString.concat('"');
        analysisGroupXMLString = analysisGroupXMLString.concat(' name="');
        analysisGroupXMLString = analysisGroupXMLString.concat(event.to.parent.name);
        analysisGroupXMLString = analysisGroupXMLString.concat('"');
        analysisGroupXMLString = analysisGroupXMLString.concat("/></analysisGroups>");
        params.set("analysisGroupsXMLString", analysisGroupXMLString);
        params.set("idAnalysisString", idAnalysisString);
        var lPromise = this.analysisService.moveAnalysis(params).toPromise();
        lPromise.then(response => {
            console.log("successful move");
        });
        this.analysisService.refreshAnalysisGroupList_fromBackend();
    }

    /**
     * The delete link was selected.
     * @param event
     */
    deleteAnalysisClicked(event: any) {
        if (this.selectedItem && this.selectedItem.level != 1 && this.items.length > 0) {
            let dialogRef: MatDialogRef<DeleteAnalysisComponent> = this.dialog.open(DeleteAnalysisComponent, {
                data: {
                    idAnalysisGroup: this.selectedItem.data.idAnalysisGroup,
                    label: this.selectedItem.data.label,
                    selectedItem: this.selectedItem,
                    nodes: this.treeModel.activeNodes
                }
            });
        }
        this.selectedItem = null;
    }

    /**
     * The New Analysis button was clicked.
     * @param event
     */
    createAnalysisClicked(event: any) {
        if (this.items.length > 0 ) {
            this.labListString = this.labList.map(function (item) {
                return item['name'];
            });
            var useThisLabList: any[];
            if (this.createSecurityAdvisorService.isSuperAdmin) {
                useThisLabList = this.labList;
            } else {
                useThisLabList = this.labs;
            }

            let dialogRef: MatDialogRef<CreateAnalysisComponent> = this.dialog.open(CreateAnalysisComponent, {
                data: {
                    labListString: this.labListString,
                    labList: useThisLabList,
                    items: this.items,
                    selectedLab: this.selectedIdLab,
                    selectedLabLabel: this.selectedLabLabel,
                    selectedItem: this.selectedItem
                }
            });
        }
    }

    /**
     * The New analysis group button was selected.
     * @param event
     */
    createAnalysisGroupClicked(event: any) {
        if (this.items.length > 0 ) {
            this.labListString = this.labList.map(function (item) {
                return item['name'];
            });
            var useThisLabList: any[];
            if (this.createSecurityAdvisorService.isSuperAdmin) {
                useThisLabList = this.labList;
            } else {
                useThisLabList = this.labs;
            }
            let dialogRef: MatDialogRef<CreateAnalysisGroupComponent> = this.dialog.open(CreateAnalysisGroupComponent, {
                width: '40em',
                data: {
                    labList: useThisLabList
                }
            });
        }
    }

    /**
     * Show the drag drop hint
     * @param event
     */
    dragDropHintClicked(event: any) {
        let dialogRef: MatDialogRef<DragDropHintComponent> = this.dialog.open(DragDropHintComponent, {
        });
    }

    /**
     * A node is selected in the tree.
     * @param event
     */
    treeOnSelect(event: any) {
        this.selectedItem = event.node;
        this.selectedIdLab = this.selectedItem.data.idLab;
        this.selectedLabLabel = this.selectedItem.data.labName;

        //Lab
        if (this.selectedItem.level === 1) {
            this.disableNewAnalysis = false;
            this.disableNewAnalysisGroup = false;
            this.disableDelete = true;
        } else if (this.selectedItem.level === 2) {
            this.disableNewAnalysis = false;
            this.disableDelete = false;
            this.disableNewAnalysisGroup = false;

            //Experiment
        } else if (this.selectedItem.level === 3) {
            this.disableNewAnalysis = false;
            this.disableDelete = false;
            this.disableNewAnalysisGroup = false;
            var params: URLSearchParams = new URLSearchParams();
            params.set("idAnalysis", this.selectedItem.data.idAnalysis);
            this.analysisService.getAnalysis(params).subscribe((response) => {
                if (response.Analysis.canDelete ==="Y") {
                    this.disableDelete = false;
                } else {
                    this.disableDelete = true;
                }
            });
        } else {

        }
    }

    ngOnDestroy(): void {
        this.analysisGroupListSubscription.unsubscribe();
    }
}
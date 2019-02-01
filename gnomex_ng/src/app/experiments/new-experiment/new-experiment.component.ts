import {
    Component, ComponentRef, OnDestroy, OnInit, Output, EventEmitter, ViewChild
} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {FormGroup} from "@angular/forms";

import {Subscription} from "rxjs";
import {first} from "rxjs/internal/operators";

import {AnnotationTabComponent, OrderType} from "../../util/annotation-tab.component";
import {CreateSecurityAdvisorService} from "../../services/create-security-advisor.service";
import {DialogsService} from "../../util/popup/dialogs.service";
import {DictionaryService} from "../../services/dictionary.service";
import {NewExperimentService} from "../../services/new-experiment.service";
import {ExperimentBioinformaticsTabComponent} from "../experiment-detail/experiment-bioinformatics-tab.component";
import {ExperimentsService} from "../experiments.service";
import {GnomexService} from "../../services/gnomex.service";
import {NewExperimentSetupComponent} from "./new-experiment-setup.component";
import {PropertyService} from "../../services/property.service";
import {TabAnnotationViewComponent} from "./tab-annotation-view.component";
import {TabConfirmIlluminaComponent} from "./tab-confirm-illumina.component";
import {TabSampleSetupViewComponent} from "./tab-sample-setup-view.component";
import {TabSamplesIlluminaComponent} from "./tab-samples-illumina.component";
import {TabSeqProtoViewComponent} from "./tab-seq-proto-view.component";
import {TabSeqSetupViewComponent} from "./tab-seq-setup-view.component";
import {TabVisibilityComponent} from "./tab-visibility.component";

import {Experiment} from "../../util/models/experiment.model";

@Component({
    selector: 'new-experiment',
    templateUrl: "./new-experiment.component.html",
    styles: [`        
        
        .bordered { border: 1px solid silver; }

    `]

})

export class NewExperimentComponent implements OnDestroy, OnInit {
    @ViewChild("setupTab") setupTab: NewExperimentSetupComponent;

    @Output() properties = new EventEmitter<any[]>();

    types = OrderType;

    public tabs: any[];
    public selectedIndex: number = 0;
    public currentTabComponent: any;

    private coreFacility: any;
    private sub: any;

    public icon: any;
    public label: string = "New Experiment Order for ";
    public numTabs: number;

    // private nextButtonIndex: number = -1;
    private annotations: any;
    private visibilityDetailObj: TabVisibilityComponent;

    public disableSubmit: boolean = true;

    private navigationSubscription: Subscription;

    public inputs = {
        lab: null,
        requestCategory: null,
        idCoreFacility: '',
        organism_current: {
            idOrganism: '',
            organism: ''
        },
        experiment: {
            idCoreFacility: '',
            PropertyEntries: [],
            requestCategory: {
                display: '',
                isIlluminaType: '',
                type: ''
            },
            RequestProperties: [],
            applicationNotes: '',
            codeApplication: '',
            codeIsolationPrepType: '',
            coreToExtractDNA: '',
            includeBisulfideConversion: '',
            includeQubitConcentration: ''
        }
    };

    outputs = {
        navigate: (type) => {
            if (type === '+') {
                this.goNext();
            } else {
                this.goBack();
            }
        },
        onChangeRequestCategory: (value: any) => {
            if (value) {
                this.icon = value.icon;
            }

            if (this.inputs.experiment.requestCategory) {
                this.label = "New " + this.inputs.experiment.requestCategory.display + " Experiment for " + this.coreFacility.display;
            }
            this.showTabs();
        }
    };
    annotationInputs = {
        annotations: this.annotations,
        orderType: this.types.EXPERIMENT,
        showConfigureAnnotationsButton: false,
        disabled: false
    };

    public get formOfCurrentlySelectedTab(): FormGroup {
        if (!this.selectedIndex && this.selectedIndex !== 0) {
            return null;
        }

        if (this.selectedIndex === 0) {
            return this.setupTab.form;
        } else if (this.tabs
            && Array.isArray(this.tabs)
            && this.selectedIndex > 0
            && this.selectedIndex <= this.tabs.length) {
            if (!this.tabs[this.selectedIndex - 1] || !this.tabs[this.selectedIndex - 1].component) {
                return null;
            } else {
                return this.tabs[this.selectedIndex - 1].instance.form;
            }
        } else {
            return null;
        }
    }

    // public getFormOfTab(index?: number): FormGroup {
    //     if (!index && index !== 0) {
    //         return this.formOfCurrentlySelectedTab;
    //     }
    //
    //     if (index === 0) {
    //         return this.setupTab.form;
    //     } else if (this.tabs
    //         && Array.isArray(this.tabs)
    //         && index >  0
    //         && index <= this.tabs.length) {
    //         if (!this.tabs[index - 1] || !this.tabs[index - 1].component) {
    //             return null;
    //         } else {
    //             return this.tabs[index - 1].instance.form;
    //         }
    //     } else {
    //         return null;
    //     }
    // }

    public get index_firstInvalidTab(): number {
        if (!this.setupTab || !this.setupTab.form) {
            return -1;
        }
        if (this.setupTab.form.invalid) {
            return 0;
        }

        let i: number = 1;
        for (let tab of this.tabs) {
            if (!tab.instance || !tab.instance.form || tab.instance.form.invalid) {
                return i;
            }
            i++;
        }

        return i; // if all valid returns higher index than in the grid (by one)
    }


    constructor(private dialogService: DialogsService,
                private dictionaryService: DictionaryService,
                private router: Router,
                private gnomexService: GnomexService,
                private newExperimentService: NewExperimentService,
                private experimentService: ExperimentsService,
                private securityAdvisor: CreateSecurityAdvisorService,
                private propertyService: PropertyService,
                private route: ActivatedRoute,) {
        this.navigationSubscription = this.router.events.subscribe((e: any) => {
            // If it is a NavigationEnd event re-initialize the component
            if (e instanceof NavigationEnd) {
                this.reinitialize();
            }
        });
    }

    reinitialize(): void {
        // should probably tell all tabs to clear their data!
    }

    ngOnInit() {
        this.sub = this.route.params.subscribe((params: any) => {

            this.currentTabComponent = null;

            if (params && params.idCoreFacility) {
                this.inputs.idCoreFacility = params.idCoreFacility;

                this.coreFacility = this.dictionaryService.getEntry('hci.gnomex.model.CoreFacility', params.idCoreFacility);

                if (!!this.coreFacility) {
                    this.label = "New Experiment for " + this.coreFacility.display;
                }

                setTimeout(() => {
                    this.dialogService.startDefaultSpinnerDialog();
                });

                this.experimentService.getNewRequest().pipe(first()).subscribe((response: any) => {
                    if (!response) {
                        return;
                    }

                    this.dialogService.stopAllSpinnerDialogs();

                    let experiment: Experiment = Experiment.createExperimentObjectFromAny(this.dictionaryService, this.gnomexService, this.propertyService, this.securityAdvisor, response.Request);
                    experiment.idCoreFacility = this.inputs.idCoreFacility;

                    this.annotations = experiment.RequestProperties.filter((annotation: any) => {
                        return annotation
                            && annotation.isActive === 'Y'
                            && annotation.idCoreFacility === params.idCoreFacility;
                    });

                    this.annotationInputs.annotations = this.annotations;

                    this.inputs.experiment = experiment;
                });
            }
        });
    }

    ngOnDestroy() {
        if (this.navigationSubscription) {
            this.navigationSubscription.unsubscribe();
        }
    }


    showTabs() {
        this.tabs = [];

        let category = this.inputs.experiment.requestCategory;
        this.inputs.requestCategory = category;

        if (!this.inputs.experiment) {
            return;
        }

        this.inputs.experiment.applicationNotes = '';
        this.inputs.experiment.codeApplication = '';
        this.inputs.experiment.codeIsolationPrepType = '';
        this.inputs.experiment.coreToExtractDNA = 'N';
        this.inputs.experiment.includeBisulfideConversion = 'N';
        this.inputs.experiment.includeQubitConcentration = 'N';

        if (category.isIlluminaType === 'Y') {
            this.gnomexService.submitInternalExperiment()
                ? this.newExperimentService.currentState = 'SolexaBaseState'
                : this.newExperimentService.currentState = 'SolexaBaseExternalState';

            let propertyTab = {
                label: "Other Details",
                disabled: true,
                component: AnnotationTabComponent
            };
            let sampleSetupTab = {
                label: "Sample Details",
                disabled: true,
                component: TabSampleSetupViewComponent
            };
            let libPrepTab = {
                label: "Library Prep",
                disabled: true,
                component: TabSeqSetupViewComponent
            };
            let seqProtoTab = {
                label: "Seq Options",
                disabled: true,
                component: TabSeqProtoViewComponent
            };
            let annotationsTab = {
                label: "Annotations",
                disabled: true,
                component: TabAnnotationViewComponent
            };
            let samplesTab = {
                label: "Experiment Design",
                disabled: true,
                component: TabSamplesIlluminaComponent
            };
            let visibilityTab = {
                label: "Visibility",
                disabled: true,
                component: TabVisibilityComponent
            };
            let bioTab = {
                label: "Bioinformatics",
                disabled: true,
                component: ExperimentBioinformaticsTabComponent
            };
            let confirmTab = {
                label: "Confirm",
                disabled: true,
                component: TabConfirmIlluminaComponent
            };
            this.tabs.push(sampleSetupTab);
            this.tabs.push(propertyTab);
            this.tabs.push(libPrepTab);
            this.tabs.push(seqProtoTab);
            this.tabs.push(annotationsTab);
            this.tabs.push(samplesTab);
            this.tabs.push(visibilityTab);
            this.tabs.push(bioTab);
            this.tabs.push(confirmTab);
            this.numTabs = 10;
        } else if (category.type === this.newExperimentService.TYPE_QC) {
            this.gnomexService.submitInternalExperiment() ? this.newExperimentService.currentState = 'QCState' :
                this.newExperimentService.currentState = 'QCExternalState';

            let sampleSetupTab = {
                label: "Sample Details",
                disabled: true,
                component: TabSampleSetupViewComponent
            };
            let visibilityTab = {
                label: "Visibility",
                disabled: true,
                component: TabVisibilityComponent
            };

            this.tabs.push(sampleSetupTab);
            this.tabs.push(visibilityTab);
        } else if (category.type === this.newExperimentService.TYPE_GENERIC) {
            this.gnomexService.submitInternalExperiment() ? this.newExperimentService.currentState = 'GenericState' :
                this.newExperimentService.currentState = 'GenericExternalState';
        } else if (category.type === this.newExperimentService.TYPE_CAP_SEQ) {
            this.newExperimentService.currentState = "CapSeqState";
        } else if (category.type === this.newExperimentService.TYPE_FRAG_ANAL) {
            this.newExperimentService.currentState = "FragAnalState";
        } else if (category.type === this.newExperimentService.TYPE_MIT_SEQ) {
            this.newExperimentService.currentState = "MitSeqState";
        } else if (category.type === this.newExperimentService.TYPE_CHERRY_PICK) {
            this.newExperimentService.currentState = "CherryPickState";
        } else if (category.type === this.newExperimentService.TYPE_ISCAN) {
            this.newExperimentService.currentState = "IScanState";
        } else if (category.type === this.newExperimentService.TYPE_SEQUENOM) {
            this.newExperimentService.currentState = "SequenomState";
        } else if (category.type === this.newExperimentService.TYPE_ISOLATION) {
            this.newExperimentService.currentState = "IsolationState";
        } else if (category.type === this.newExperimentService.TYPE_NANOSTRING) {
            this.newExperimentService.currentState = "NanoStringState";
        } else if (category.type === this.newExperimentService.TYPE_CLINICAL_SEQUENOM) {
            this.newExperimentService.currentState = "ClinicalSequenomState";
        } else if (category.type === this.newExperimentService.TYPE_MICROARRAY) {
            this.gnomexService.submitInternalExperiment()
                ? this.newExperimentService.currentState = 'MicroarrayState'
                : this.newExperimentService.currentState = 'MicroarrayExternalState';
        }
    }

    onTabChange(event) {
        this.selectedIndex = event.index;

        if (this.tabs
            && event
            && event.index
            && event.index > 0
            && event.index <= this.tabs.length
            && this.tabs[event.index - 1]
            && this.tabs[event.index - 1].instance
            && typeof this.tabs[event.index - 1].instance.tabDisplayed === 'function') {
            // this is important for validating the experiment's samples, where changes were made off of the samples grid tab.
            this.tabs[event.index - 1].instance.tabDisplayed();
        }
    }

    goBack() {
        this.selectedIndex--;
        this.currentTabComponent = this.newExperimentService.components[this.selectedIndex]
    }

    goNext() {
        switch (this.newExperimentService.currentState) {
            case 'SolexaBaseState' : {
                if (this.selectedIndex === 0) {
                    this.tabs[0].disabled = false;
                    this.tabs[1].disabled = false;
                } else if (this.selectedIndex === 1) {
                    this.tabs[2].disabled = false;
                } else if (this.selectedIndex === 2) {
                    this.tabs[3].disabled = false;
                } else if (this.selectedIndex === 3) {
                    this.tabs[4].disabled = false;
                } else if (this.selectedIndex === 4) {
                    this.tabs[5].disabled = false;
                } else if (this.selectedIndex === 5) {
                    this.tabs[6].disabled = false;
                } else if (this.selectedIndex === 6) {
                    this.tabs[7].disabled = false;
                } else if (this.selectedIndex === 7) {
                    this.tabs[8].disabled = false;
                } else if (this.selectedIndex === 8) {
                    this.disableSubmit = true;
                }
                break;
            }
            case 'QCState' : {
                if (this.selectedIndex === 0) {
                    this.tabs[0].disabled = false;
                }
            }

        }

        this.selectedIndex++;
        this.currentTabComponent = this.newExperimentService.components[this.selectedIndex];
    }


    componentCreated(compRef: ComponentRef<any>) {
        if (compRef) {
            this.newExperimentService.components.push(compRef.instance);

            if (compRef.instance instanceof TabVisibilityComponent) {
                this.visibilityDetailObj = compRef.instance as TabVisibilityComponent;
            }

            for (let tab of this.tabs) {
                if (compRef.instance instanceof tab.component) {
                    tab.instance = compRef.instance;
                }
            }
        }
    }

    public onChangeLab(event: any): void {
        this.inputs.lab = event;
    }


    public clickCancel(): void {
        console.log("Cancel clicked!");
    }

    public onClickDebug() {
        console.log("Debug clicked!");

        // console.log("Spoofing new experiment!");
        //
        // let spoofedExperiment: any = this.newExperimentService.spoofNewExperimentObject();
        // let spoofedProperties: any = { requestProperties: [] };
        //
        // this.newExperimentService.saveNewRequest(62962, '$580.00', '', spoofedExperiment, spoofedProperties).subscribe((response: any) => {
        //     console.log("SaveRequest returned");
        // });
    }
}


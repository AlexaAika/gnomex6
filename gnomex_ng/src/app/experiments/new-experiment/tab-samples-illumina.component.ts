import {Component, ElementRef, Input, OnInit, ViewChild} from "@angular/core";
import {MatDialog, MatDialogConfig} from "@angular/material";
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";

import {Subscription} from "rxjs";

import {DictionaryService} from "../../services/dictionary.service";
import {ConstantsService} from "../../services/constants.service";
import {SelectRenderer} from "../../util/grid-renderers/select.renderer";
import {SelectEditor} from "../../util/grid-editors/select.editor";
import {TextAlignLeftMiddleEditor} from "../../util/grid-editors/text-align-left-middle.editor";
import {TextAlignLeftMiddleRenderer} from "../../util/grid-renderers/text-align-left-middle.renderer";
import {GnomexService} from "../../services/gnomex.service";
import {UploadSampleSheetComponent} from "../../upload/upload-sample-sheet.component";
import {BarcodeSelectEditor} from "../../util/grid-editors/barcode-select.editor";
import {annotType} from "../../services/property.service";
import {CheckboxRenderer} from "../../util/grid-renderers/checkbox.renderer";
import {UrlAnnotEditor} from "../../util/grid-editors/url-annot-editor";
import {UrlAnnotRenderer} from "../../util/grid-renderers/url-annot-renderer";
import {MultiSelectRenderer} from "../../util/grid-renderers/multi-select.renderer";
import {MultiSelectEditor} from "../../util/grid-editors/multi-select.editor";
import {TabSampleSetupViewComponent} from "./tab-sample-setup-view.component";
import {TextAlignRightMiddleRenderer} from "../../util/grid-renderers/text-align-right-middle.renderer";
import {Experiment} from "../../util/models/experiment.model";
import {Sample} from "../../util/models/sample.model";
import {AnnotationService} from "../../services/annotation.service";

@Component({
    selector: "tab-samples-illumina",
    templateUrl: "./tab-samples-illumina.component.html",
    styles: [`


        .no-height { height: 0;  }
        .single-em { width: 1em; }
        
        .horizontal-spacer {
            height: 80%;
            width: 2px;
            background-color: lightgrey;
        }
        
        .allow-line-breaks {
            white-space: pre-line;
        }
        .sample-instructions {
            background-color: lightyellow;
            
            width: 40rem;
            
            min-width:  45%;
            max-width: 100%;
        }
        /*For achieving wrap around column header*/
        ::ng-deep .ag-header-cell-text {
            text-overflow: clip !important;
            overflow: visible !important;
            white-space: normal !important;
        }
        

    `]
})

export class TabSamplesIlluminaComponent implements OnInit {

    @ViewChild('oneEmWidth') oneEmWidth: ElementRef;

    private emToPxConversionRate: number = 16;

    @Input('experiment') public set experiment(value: Experiment) {
        this._experiment = value;

        if (!this.onChange_numberOfSamplesSubscription) {
            this.onChange_numberOfSamplesSubscription = this._experiment.onChange_numberOfSamples.subscribe((value) =>{
                if (value && this.samplesGridApi) {
                    if (+(this._experiment.numberOfSamples) > 0) {
                        this.buildInitialRows();
                    }
                }
                if (this.samplesGridApi && this._experiment.numberOfSamples) {
                    this.samplesGridApi.forEachNode((node: any) => {
                        if (node.data.name === this._experiment.sampleType) {
                            node.setSelected(true);
                        }
                    });
                }
            });
        }

        if (!this.onChange_sampleTypeSubscription) {
            this.onChange_sampleTypeSubscription = this._experiment.onChange_sampleType.subscribe((value) => {
                if (value && this.samplesGridApi) {
                    this.changeSampleType();
                }
            });
        }

        if (!this.onChange_organismSubscription) {
            this.onChange_organismSubscription = this._experiment.onChange_organism.subscribe((value) => {
                if (value && this.samplesGridApi) {
                    this.changeOrganism();
                    this.requireReconfirmation();
                }
            });
        }

        if (!this.onChange_codeApplicationSubscription) {
            this._experiment.onChange_codeApplication.subscribe((value) => {
                if (value && this.samplesGridApi) {
                    this.changeCode();
                }
            });
        }

        if (!this.onChange_selectedProtocolSubscription) {
            this._experiment.onChange_selectedProtocol.subscribe((value) => {
                if (value && this.samplesGridApi) {
                    this.updateRows();
                }
            });
        }
    }

    private _experiment: Experiment;

    private _barCodes: any[] = [];

    private onChange_numberOfSamplesSubscription: Subscription;
    private onChange_sampleTypeSubscription: Subscription;
    private onChange_organismSubscription: Subscription;
    private onChange_codeApplicationSubscription: Subscription;
    private onChange_selectedProtocolSubscription: Subscription;

    public static readonly ANNOTATION_ATTRIBUTE_NAME_PREFIX :string = "ANNOT";

    public readonly BASIC_INSTRUCTIONS: string = ''
        + '1.  Assign a multiplex group number for each sample in the table below. Samples that are to be sequenced in the same lane should be assigned the same multiplex group number.\n'
        + '2.  Provide a name for each sample.\n'
        + '3.  Provide the concentration for each sample if available.\n'
        + '4.  Type the volume (ul) that will be provided for each sample.\n'
        + '5.  Specify the number of sequence lanes required for each multiplex group.\n'
        + '6.  Optional: Annotate the samples using the characteristics that you selected from the Annotations tab.\n'
        + '7.  Optional: Edit other fields as appropriate.';

    public readonly TOOLTIP_TEXT: string = ''
        + 'Instructions\n'
        + '1. Mandatory: Fill in the following highlighted fields: Multiplex Group #, Sample Name(Max 30 characters)\n'
        + '2. Optional: Any annotation characteristic that you selected from the previous screen appears on this screen'
        + 'as a highlighted column. Please type desired information under the highlighted field with the annotation header.\n'
        + '3. After completing all line items, click the \'Next\' button at the bottom of the the page to proceed.'
        + 'You may also upload a sample sheet. Please see the \'Sample sheet help\' for more help.';

    public sampleTypes: any[] = [];
    public organisms: any[] = [];
    public form: FormGroup;

    private hideCCNum: boolean = true;
    private gridColumnApi;

    public showInstructions: boolean = false;

    private samplesGridApi: any;

    private samplesGridColumnDefs: any[];

    private _tabIndexToInsertAnnotations: number = 0;

    private propertyList: any[] = [];


    private get defaultSampleColumnDefinitions(): any[] {
        let temp: any[] = [];

        temp.push({
            headerName: "",
            field: "index",
            width:    1.5 * this.emToPxConversionRate,
            maxWidth: 1.5 * this.emToPxConversionRate,
            minWidth: 1.5 * this.emToPxConversionRate,
            cellRendererFramework: TextAlignRightMiddleRenderer,
            suppressSizeToFit: true
        });
        temp.push({
            headerName: "Multiplex Group",
            editable: true,
            field: "multiplexGroupNumber",
            width:    5 * this.emToPxConversionRate,
            minWidth: 3 * this.emToPxConversionRate,
            maxWidth: 7 * this.emToPxConversionRate,
            suppressSizeToFit: true,
            cellEditorFramework: TextAlignLeftMiddleEditor,
            cellRendererFramework: TextAlignLeftMiddleRenderer,
            showFillButton: true,
            fillGroupAttribute: 'frontEndGridGroup',
            validators: [
                Validators.required,
                Validators.pattern(/^\d*$/)
            ],
            errorNameErrorMessageMap: [
                { errorName: 'required', errorMessage: 'Multiplex Group required' },
                { errorName: 'pattern',  errorMessage: 'Multiplex Group must be numeric' }
            ],
            outerForm: this.form,
            formName:  "gridFormGroup"
        });
        temp.push({
            headerName: "Sample Name",
            field: "name",
            width:    7 * this.emToPxConversionRate,
            minWidth: 5 * this.emToPxConversionRate,
            maxWidth: 9 * this.emToPxConversionRate,
            editable: true,
            cellRendererFramework: TextAlignLeftMiddleRenderer,
            cellEditorFramework: TextAlignLeftMiddleEditor,
            validators: [ Validators.required ],
            errorNameErrorMessageMap: [
                { errorName: 'required', errorMessage: 'Sample Name required' }
            ]
        });
        temp.push({
            headerName: "Conc. (ng/ul)",
            field: "concentration",
            width:    5.5 * this.emToPxConversionRate,
            minWidth: 3 * this.emToPxConversionRate,
            maxWidth: 7 * this.emToPxConversionRate,
            suppressSizeToFit: true,
            editable: true,
            cellRendererFramework: TextAlignRightMiddleRenderer,
            cellEditorFramework: TextAlignLeftMiddleEditor,
            showFillButton: true,
            fillGroupAttribute: 'frontEndGridGroup'
        });
        temp.push({
            headerName: "Vol. (ul)",
            field: "volume",
            width:    5.5 * this.emToPxConversionRate,
            minWidth: 3 * this.emToPxConversionRate,
            maxWidth: 7 * this.emToPxConversionRate,
            suppressSizeToFit: true,
            editable: true,
            cellRendererFramework: TextAlignRightMiddleRenderer,
            cellEditorFramework: TextAlignLeftMiddleEditor,
            showFillButton: true,
            fillGroupAttribute: 'frontEndGridGroup'
        });
        temp.push({
            headerName: "CC Number",
            field: "ccNum",
            width:    7 * this.emToPxConversionRate,
            minWidth: 6 * this.emToPxConversionRate,
            maxWidth: 8 * this.emToPxConversionRate,
            suppressSizeToFit: true,
            editable: true,
            cellRendererFramework: TextAlignLeftMiddleRenderer,
            cellEditorFramework: TextAlignLeftMiddleEditor,
            showFillButton: true,
            fillGroupAttribute: 'frontEndGridGroup',
            hide: this.hideCCNum
        });

        this._tabIndexToInsertAnnotations = temp.length;

        temp.push({
            headerName: "# Seq Lanes",
            field: "numberSequencingLanes",
            width:    5 * this.emToPxConversionRate,
            minWidth: 4 * this.emToPxConversionRate,
            maxWidth: 6 * this.emToPxConversionRate,
            editable: true,
            cellRendererFramework: TextAlignRightMiddleRenderer,
            cellEditorFramework: TextAlignLeftMiddleEditor,
            showFillButton: true,
            fillGroupAttribute: 'frontEndGridGroup',
            headerTooltip: "This is the number of times(1 or greater) that you want to sequence this sample.",
            cellStyle: {color: 'black', 'background-color': 'LightGreen'}
        });
        temp.push({
            headerName: "Sample Type",
            editable: true,
            width:    10 * this.emToPxConversionRate,
            minWidth: 7 * this.emToPxConversionRate,
            field: "idSampleType",
            cellRendererFramework: SelectRenderer,
            cellEditorFramework: SelectEditor,
            selectOptions: this.sampleTypes,
            selectOptionsDisplayField: "sampleType",
            selectOptionsValueField: "idSampleType",
            showFillButton: true,
            fillGroupAttribute: 'frontEndGridGroup'
        });
        temp.push({
            headerName: "Organism",
            editable: true,
            width:    10 * this.emToPxConversionRate,
            minWidth: 7  * this.emToPxConversionRate,
            field: "idOrganism",
            cellRendererFramework: SelectRenderer,
            cellEditorFramework: SelectEditor,
            selectOptions: this.organisms,
            selectOptionsDisplayField: "display",
            selectOptionsValueField: "idOrganism",
            showFillButton: true,
            fillGroupAttribute: 'frontEndGridGroup',
            validators: [Validators.required],
            errorNameErrorMessageMap: [
                {errorName: 'required', errorMessage: 'Multiplex Group required'}
            ]
        });
        temp.push({
            headerName: "Seq Lib Protocol",
            editable: false,
            width:    15 * this.emToPxConversionRate,
            minWidth: 7  * this.emToPxConversionRate,
            field: "idSeqLibProtocol",
            cellRendererFramework: SelectRenderer,
            cellEditorFramework: SelectEditor,
            selectOptions: this.gnomexService.seqLibProtocolsWithAppFilters,
            selectOptionsDisplayField: "display",
            selectOptionsValueField: "idSeqLibProtocol"
        });
        if (this._experiment
            && this._experiment.seqPrepByCore_forSamples
            && this._experiment.seqPrepByCore_forSamples === 'Y') {

            temp.push({
                headerName: "Index Tag A",
                editable: true,
                width:    9 * this.emToPxConversionRate,
                minWidth: 9 * this.emToPxConversionRate,
                maxWidth: 15 * this.emToPxConversionRate,
                field: "idOligoBarcode",
                cellRendererFramework: SelectRenderer,
                cellEditorFramework: BarcodeSelectEditor,
                selectOptions: this._barCodes,
                selectOptionsDisplayField: "display",
                selectOptionsValueField: "idOligoBarcode",
                indexTagLetter: 'A',
                validators: [Validators.required],
                errorNameErrorMessageMap: [
                    {errorName: 'required', errorMessage: 'Index Tag A required'}
                ]
            });
            temp.push({
                headerName: "Index Tag Sequence A",
                field: "barcodeSequence",
                width:    5.5 * this.emToPxConversionRate,
                minWidth: 5 * this.emToPxConversionRate,
                maxWidth: 7 * this.emToPxConversionRate,
                suppressSizeToFit: true,
                editable: false
            });
            temp.push({
                headerName: "Index Tag B",
                editable: true,
                width:    9 * this.emToPxConversionRate,
                minWidth: 9 * this.emToPxConversionRate,
                maxWidth: 15 * this.emToPxConversionRate,
                field: "idOligoBarcodeB",
                cellRendererFramework: SelectRenderer,
                cellEditorFramework: BarcodeSelectEditor,
                selectOptions: this._barCodes,
                selectOptionsDisplayField: "display",
                selectOptionsValueField: "idOligoBarcodeB",
                indexTagLetter: 'B'
            });
            temp.push({
                headerName: "Index Tag Sequence B",
                field: "barcodeSequenceB",
                width:    5.5 * this.emToPxConversionRate,
                minWidth: 5 * this.emToPxConversionRate,
                maxWidth: 7 * this.emToPxConversionRate,
                suppressSizeToFit: true,
                editable: false,
            });
        }

        return temp;
    }


    constructor(public constService: ConstantsService,
                private annotationService: AnnotationService,
                private dictionaryService: DictionaryService,
                private gnomexService: GnomexService,
                private fb: FormBuilder,
                private dialog: MatDialog) {

        this.organisms = this.dictionaryService.getEntries("hci.gnomex.model.OrganismLite");

        this.form = this.fb.group({});

        this.form.addControl(
            'invalidateWithoutSamples',
            new FormControl('', (control: AbstractControl) => {
                if (control
                && control.parent
                && control.parent.controls
                && control.parent.controls['gridFormGroup']
                && control.parent.controls['gridFormGroup'].controls) {
                    return null;
                } else {
                    return { message: 'Grid is not populated yet' };
                }
            })
        );

        this.samplesGridColumnDefs = this.defaultSampleColumnDefinitions;

        this.annotationService.getPropertyList().subscribe((result) => {
            this.propertyList = result;
        });
    }

    ngOnInit() {
        // this.sampleTypes = this.samplesService.filterSampleTypes(this.dictionaryService.getEntries("hci.gnomex.model.SampleType"), null);
        this.loadSampleTypes();
        this.showHideColumns();

        this.loadBarcodes();
    }

    ngOnDestroy() {
        if (this.onChange_numberOfSamplesSubscription) {
            this.onChange_numberOfSamplesSubscription.unsubscribe();
        }
        if (this.onChange_sampleTypeSubscription) {
            this.onChange_sampleTypeSubscription.unsubscribe();
        }
        if (this.onChange_organismSubscription) {
            this.onChange_organismSubscription.unsubscribe();
        }
        if (this.onChange_codeApplicationSubscription) {
            this.onChange_codeApplicationSubscription.unsubscribe();
        }
        if (this.onChange_selectedProtocolSubscription) {
            this.onChange_selectedProtocolSubscription.unsubscribe();
        }
    }

    private loadBarcodes(): void {
        this._barCodes = [];

        let allBarcodes = this.dictionaryService.getEntriesExcludeBlank("hci.gnomex.model.OligoBarcode");
        for (let code of allBarcodes) {
            code.idOligoBarcodeB = code.idOligoBarcode;
            this._barCodes.push(code);
        }
    }

    private loadSampleTypes(): void {
        let types: any[] = [];

        for (let sampleType of this.dictionaryService.getEntriesExcludeBlank("hci.gnomex.model.SampleType")) {
            if (sampleType.isActive === 'N'
                || (sampleType.codeNucleotideType !== "RNA" && sampleType.codeNucleotideType !== "DNA")) {

                continue;
            }

            let requestCategories = this.dictionaryService.getEntriesExcludeBlank("hci.gnomex.model.SampleTypeRequestCategory").filter(sampleRequestCategory =>
                sampleRequestCategory.value !== "" && sampleRequestCategory.idSampleType === sampleType.value
            );

            for (let requestCategory of requestCategories) {
                if (this._experiment && requestCategory.codeRequestCategory === this._experiment.codeRequestCategory) {
                    types.push(sampleType);
                }
            }
        }

        this.sampleTypes = types.sort(TabSampleSetupViewComponent.sortSampleTypes);
    }

    public requireReconfirmation(): void {
        if (this.form && !this.form.contains('invalidateWithoutConfirmation')) {
            this.form.addControl(
                'invalidateWithoutConfirmation',
                new FormControl('', (control: AbstractControl) => {
                    return { message: 'Samples have changed. They require review.' };
                })
            );
        }
    }

    public confirm(): void {
        if (this.form && this.form.contains('invalidateWithoutConfirmation')) {
            this.form.removeControl('invalidateWithoutConfirmation');
        }
    }

    public tabDisplayed(): void {
        this.rebuildColumnDefinitions();
        this.confirm();
    }

    private rebuildColumnDefinitions(): void {
        let temp: any[]  = this.defaultSampleColumnDefinitions;

        if (this._experiment) {
            for (let sampleAnnotation of this._experiment.getSelectedSampleAnnotations()) {
                let fullProperty = this.propertyList.filter((value: any) => {
                    return value.idProperty === sampleAnnotation.idProperty;
                });

                if (fullProperty && Array.isArray(fullProperty) && fullProperty.length > 0) {
                    this.addColumnToColumnDef(temp, fullProperty[0]);
                }
            }
        }

        // clear out data for annotations that have been removed since last rebuild
        let foundAllOldColumns = true;
        for (let oldColumn of this.samplesGridColumnDefs) {
            let foundOldColumn: boolean = false;
            for (let newColumn of temp) {
                if (newColumn.field && oldColumn.field && ('' + newColumn.field).localeCompare('' + oldColumn.field) === 0) {
                    foundOldColumn = true;
                    break;
                }
            }

            if (!foundOldColumn) {
                foundAllOldColumns = false;
                // the old column was removed, remove the values from the samples.
                for (let sample of this._experiment.samples) {
                    // Delete is important here, as it actually removes the attribute in question.
                    if (oldColumn.field && ('' + oldColumn.field).startsWith(TabSamplesIlluminaComponent.ANNOTATION_ATTRIBUTE_NAME_PREFIX)) {
                        delete sample[oldColumn.field];
                    } else {
                        sample[oldColumn.field] = '';
                    }
                }
            }
        }

        if (foundAllOldColumns && this.samplesGridColumnDefs.length === temp.length) {
            // Do nothing - there is no change needed
            this.samplesGridApi.redrawRows();
        } else {
            this.samplesGridColumnDefs = temp;

            this.samplesGridApi.setColumnDefs(this.samplesGridColumnDefs);
            this.samplesGridApi.setRowData(this._experiment.samples);
            this.samplesGridApi.sizeColumnsToFit();
        }
    }

    private showHideColumns() {
        let hideSampleTypeOnExternalExperiment: boolean = false;
        if (!this.gnomexService.isInternalExperimentSubmission && this.gnomexService.getProperty(this.gnomexService.PROPERTY_HIDE_SAMPLETYPE_ON_EXTERNAL_EXPERIMENT) === "Y") {
            hideSampleTypeOnExternalExperiment = true;
        }
    }

    private changeOrganism() {
        if (this.samplesGridApi) {
            // this.samplesGridApi.forEachNode((node: any) => {
            //     node.data.idOrganism = this._experiment.organism.idOrganism;
            // });
            this.samplesGridApi.redrawRows();
        }
    }

    private changeCode() {
        if (this.samplesGridApi) {
            let protocol = this._experiment.codeApplication ? this.dictionaryService.getProtocolFromApplication(this._experiment.codeApplication) : '';
            this.samplesGridApi.forEachNode((node: any) => {
                node.data.idSeqLibProtocol = protocol.idSeqLibProtocol;
            });
            this.samplesGridApi.redrawRows();
        }
    }

    private updateRows() {

        if (!this._experiment) {
            return;
        }

        let idSampleType: string = '';
        let idOrganism: string = '';
        let idNumberSequencingCycles: string = '';
        let idNumberSequencingCyclesAllowed: string = '';
        let idSeqRunType: string = '';
        let protocol: any = '';
        let numberSequencingLanes: string = this._experiment.isRapidMode === 'Y' ? '2' : '1';

        if (this.gnomexService.submitInternalExperiment() && this._experiment.sampleType) {
            idSampleType = this._experiment.sampleType.idSampleType;
        } else if (this._experiment.idSampleTypeDefault != null) {
            idSampleType = this._experiment.idSampleTypeDefault;
        } else {
            // Do nothing; use default value
        }

        if (this.gnomexService.submitInternalExperiment() && this._experiment.organism) {
            idOrganism = this._experiment.organism.idOrganism
        } else if (this._experiment.idOrganismSampleDefault != null) {
            idOrganism = this._experiment.idOrganismSampleDefault;
        } else {
            // Do nothing; use default value
        }

        if (this.gnomexService.submitInternalExperiment() && this._experiment.selectedProtocol) {
            idNumberSequencingCycles = this._experiment.selectedProtocol.idNumberSequencingCycles;
        }

        if (this.gnomexService.submitInternalExperiment() && this._experiment.selectedProtocol) {
            idNumberSequencingCyclesAllowed = this._experiment.selectedProtocol.idNumberSequencingCyclesAllowed;
        }

        if (this.gnomexService.submitInternalExperiment() && this._experiment.selectedProtocol) {
            idSeqRunType = this._experiment.selectedProtocol.idSeqRunType;
        }

        if (this._experiment.codeApplication) {
            protocol = this.dictionaryService.getProtocolFromApplication(this._experiment.codeApplication)
        }

        for (let sample of this._experiment.samples) {
            sample.idNumberSequencingCycles = idNumberSequencingCycles;
            sample.idNumberSequencingCyclesAllowed = idNumberSequencingCyclesAllowed;
            sample.idSeqRunType = idSeqRunType;
            sample.numberSequencingLanes = numberSequencingLanes;
            sample.idSampleType = idSampleType;
            sample.idSeqLibProtocol = protocol.idSeqLibProtocol;
            sample.idOrganism = idOrganism;
        }
    }

    private buildInitialRows() {

        if (this._experiment && this._experiment.numberOfSamples) {

            let idSampleType: string = '';
            let idOrganism: string = '';
            let idNumberSequencingCycles: string = '';
            let idNumberSequencingCyclesAllowed: string = '';
            let idSeqRunType: string = '';
            let protocol: any = '';
            let numberSequencingLanes: string = this._experiment.isRapidMode === 'Y' ? '2' : '1';
            let seqPrepByCore: any = '';

            if (this.gnomexService.submitInternalExperiment() && this._experiment.sampleType) {
                idSampleType = this._experiment.sampleType.idSampleType;
            } else if (this._experiment.idSampleTypeDefault != null) {
                idSampleType = this._experiment.idSampleTypeDefault
            } else {
                // do nothing, leave idSampleType as default.
            }

            if (this.gnomexService.submitInternalExperiment() && this._experiment.organism) {
                idOrganism = this._experiment.organism.idOrganism;
            } else if (this._experiment.idOrganismSampleDefault != null) {
                idOrganism = this._experiment.idOrganismSampleDefault;
            } else {
                // do nothing, leave idOrganism as default.
            }

            if (this.gnomexService.submitInternalExperiment() && this._experiment.selectedProtocol) {
                idNumberSequencingCycles = this._experiment.selectedProtocol.idNumberSequencingCycles;
            }

            if (this.gnomexService.submitInternalExperiment() && this._experiment.selectedProtocol) {
                idNumberSequencingCyclesAllowed = this._experiment.selectedProtocol.idNumberSequencingCyclesAllowed
            }

            if (this.gnomexService.submitInternalExperiment() && this._experiment.selectedProtocol) {
                idSeqRunType = this._experiment.selectedProtocol.idSeqRunType
            }

            if (this._experiment.codeApplication) {
                protocol = this.dictionaryService.getProtocolFromApplication(this._experiment.codeApplication)
            }

            if (this._experiment && this._experiment.seqPrepByCore_forSamples) {
                seqPrepByCore = this._experiment.seqPrepByCore_forSamples;
            }

            let index = +(this._experiment.numberOfSamples) - this._experiment.samples.length;

            if (index > 0) {
                for (let i = 0; i < index; i++) {
                    let obj: Sample = new Sample(this.dictionaryService);

                    obj.index = this._experiment.samples.length + 1;
                    obj.idSample = 'Sample' + this.getNextSampleId().toString();
                    obj.multiplexGroupNumber = "";
                    obj.name = "";
                    obj.canChangeSampleName = 'Y';
                    obj.canChangeSampleType = 'Y';
                    obj.canChangeSampleConcentration = 'Y';
                    obj.canChangeSampleSource = 'Y';
                    obj.canChangeNumberSequencingCycles = 'Y';
                    obj.canChangeNumberSequencingLanes = 'Y';
                    obj.concentration = "";
                    obj.label = '';
                    obj.idOligoBarcode = '';
                    obj.barcodeSequence = '';
                    obj.idOligoBarcodeB = '';
                    obj.barcodeSequenceB = '';
                    obj.idNumberSequencingCycles = idNumberSequencingCycles;
                    obj.idNumberSequencingCyclesAllowed = idNumberSequencingCyclesAllowed;
                    obj.idSeqRunType = idSeqRunType;
                    obj.numberSequencingLanes = numberSequencingLanes;
                    obj.idSampleType = idSampleType;
                    obj.idSeqLibProtocol = protocol.idSeqLibProtocol;
                    obj.seqPrepByCore = seqPrepByCore;
                    obj.idOrganism = idOrganism;
                    obj.prepInstructions = '';
                    obj.otherOrganism = '';
                    obj.treatment = '';
                    obj.frontEndGridGroup = '0';

                    this._experiment.samples.push(obj);
                }
            } else if (index < 0) {
                this._experiment.samples.splice(-1, Math.abs(index));
            }

            this.samplesGridApi.setColumnDefs(this.samplesGridColumnDefs);
            this.samplesGridApi.setRowData(this._experiment.samples);
            this.samplesGridApi.sizeColumnsToFit();

            if (this.form && this.form.get('invalidateWithoutSamples')) {
                this.form.removeControl('invalidateWithoutSamples');
            }
        }
    }

    protected getNextSampleId(): number {
        let lastId: number = -1;

        for (let sample of this._experiment.samples) {
            if (sample.idSample.indexOf("Sample") === 0) {
                let id: number = +(sample.idSample.toString().substr(6));
                if (id > lastId) {
                    lastId = id;
                }
            }
        }

        lastId++;
        return lastId;
    }

    private changeSampleType() {
        if (this.samplesGridApi) {
            this.samplesGridApi.redrawRows();  // probably only gets hit when off of this tab...
        }
    }

    public toggleCC(event) {
        if (this.gridColumnApi
            && this.gridColumnApi.columnController
            && this.gridColumnApi.columnController.gridColumns
            && Array.isArray(this.gridColumnApi.columnController.gridColumns)) {

            let temp: any[] = this.gridColumnApi.columnController.gridColumns.filter((value: any) => {
                return value && value.colDef && value.colDef.field && value.colDef.field === 'ccNum'
            });

            if (temp.length > 0) {
                this.gridColumnApi.setColumnVisible(temp[0].colId, event.checked);
            }

            this.form.get('invalidateWithoutSamples').setValue(true);
        }
    }

    public onSamplesGridReady(event: any) {
        this.samplesGridApi = event.api;
        this.gridColumnApi = event.columnApi;
        event.api.setHeaderHeight(50);

        this.samplesGridApi.setColumnDefs(this.samplesGridColumnDefs);
        this.samplesGridApi.setRowData(this._experiment.samples);
        this.samplesGridApi.sizeColumnsToFit();
    }

    public onGridSizeChanged(event: any) {
        if (this.oneEmWidth && this.oneEmWidth.nativeElement) {
            this.emToPxConversionRate = this.oneEmWidth.nativeElement.offsetWidth;
        }

        if (event && event.api) {
            event.api.sizeColumnsToFit();
        }
    }

    public onCellValueChanged(event) {
        if (event.colDef.headerName === "Index Tag A") {
            let barcode = this._barCodes.filter(barcode => barcode.idOligoBarcode === event.data.idOligoBarcode);
            if (Array.isArray(barcode) && barcode.length > 0) {
                if (this.samplesGridApi
                    && this.samplesGridApi.getRowNode(event.rowIndex)
                    && this.samplesGridApi.getRowNode(event.rowIndex).data) {
                    this.samplesGridApi.getRowNode(event.rowIndex).data.barcodeSequence = barcode[0].barcodeSequence;
                }

                this.samplesGridApi.redrawRows();
            }
        } else if (event.colDef.headerName === "Index Tag B") {
            let barcode = this._barCodes.filter(barcode => barcode.idOligoBarcodeB === event.data.idOligoBarcodeB);
            if (Array.isArray(barcode) && barcode.length > 0) {
                if (this.samplesGridApi
                    && this.samplesGridApi.getRowNode(event.rowIndex)
                    && this.samplesGridApi.getRowNode(event.rowIndex).data) {

                    this.samplesGridApi.getRowNode(event.rowIndex).data.barcodeSequenceB = barcode[0].barcodeSequence;
                }

                this.samplesGridApi.redrawRows();
            }
        }
    }

    public upload(): void {
        let data = {
            sampleColumns: this.samplesGridColumnDefs,
            rowData: this._experiment.samples
        };

        let config: MatDialogConfig = new MatDialogConfig();
        config.width = '60em';
        config.height = '45em';
        config.panelClass = 'no-padding-dialog';
        config.data = data;

        let dialogRef = this.dialog.open(UploadSampleSheetComponent, config);

        dialogRef.afterClosed().subscribe((result) => {
            this.samplesGridApi.refreshCells();
        });
    }

    public download(): void { }

    public onClickShowInstructions(): void {
        this.showInstructions = !this.showInstructions;
    }

    private addColumnToColumnDef(columnDefs: any[], annot: any): void {
        if (!annot || !annot.idProperty) {
            return;
        }

        let column: any;
        switch(annot.codePropertyType) {
            case annotType.CHECK :
                column = this.createCheckColumn(annot);
                break;
            case annotType.MOPTION :
                column = this.createMoptionColumn(annot);
                break;
            case annotType.OPTION :
                column = this.createOptionColumn(annot);
                break;
            case annotType.URL :
                column = this.createUrlColumn(annot);
                break;
            case annotType.TEXT :
                column = this.createTextColumn(annot);
                break;
            default:
                column = this.createTextColumn(annot);
        }

        if (!columnDefs || !Array.isArray(columnDefs)) {
            columnDefs = [];
        }

        if (!this._tabIndexToInsertAnnotations) {
            this._tabIndexToInsertAnnotations = columnDefs.length;
        }

        columnDefs.splice(this._tabIndexToInsertAnnotations, 0, column);
    }

    private createCheckColumn(annot: any) {
        return {
            headerName: annot.display,
            editable: false,
            checkboxEditable: true,
            idProperty: annot.idProperty,
            width:    10 * this.emToPxConversionRate,
            minWidth: 7 * this.emToPxConversionRate,
            suppressSizeToFit: true,
            field: TabSamplesIlluminaComponent.ANNOTATION_ATTRIBUTE_NAME_PREFIX + annot.idProperty,
            cellRendererFramework: CheckboxRenderer,
        };
    }

    private createMoptionColumn(annot: any): any{
        return {
            headerName: annot.display,
            editable: true,
            width:    10 * this.emToPxConversionRate,
            minWidth: 7 * this.emToPxConversionRate,
            suppressSizeToFit: true,
            idProperty: annot.idProperty,
            field: TabSamplesIlluminaComponent.ANNOTATION_ATTRIBUTE_NAME_PREFIX + annot.idProperty,
            cellRendererFramework: MultiSelectRenderer,
            cellEditorFramework: MultiSelectEditor,
            selectOptions: annot.options,
            selectOptionsDisplayField: "option",
            selectOptionsValueField: "idPropertyOption",
            showFillButton: true,
            fillGroupAttribute: 'frontEndGridGroup'
        };

    }

    private createOptionColumn(annot: any): any {
        return {
            headerName: annot.display,
            editable: true,
            width:    10 * this.emToPxConversionRate,
            minWidth: 7 * this.emToPxConversionRate,
            suppressSizeToFit: true,
            idProperty: annot.idProperty,
            field: TabSamplesIlluminaComponent.ANNOTATION_ATTRIBUTE_NAME_PREFIX + annot.idProperty,
            cellRendererFramework: SelectRenderer,
            cellEditorFramework: SelectEditor,
            selectOptions: annot.options,
            selectOptionsDisplayField: "option",
            selectOptionsValueField: "idPropertyOption",
            showFillButton: true,
            fillGroupAttribute: 'frontEndGridGroup'
        };
    }

    private createTextColumn(annot: any): any {
        return {
            headerName: annot.display,
            field: TabSamplesIlluminaComponent.ANNOTATION_ATTRIBUTE_NAME_PREFIX + annot.idProperty,
            width:    10 * this.emToPxConversionRate,
            minWidth: 7 * this.emToPxConversionRate,
            suppressSizeToFit: true,
            idProperty: annot.idProperty,
            cellRendererFramework: TextAlignLeftMiddleRenderer,
            cellEditorFramework: TextAlignLeftMiddleEditor,
            editable: true
        };
    }

    private createUrlColumn(annot: any): any {
        return {
            headerName: annot.display,
            editable: true,
            width:    10 * this.emToPxConversionRate,
            minWidth: 7 * this.emToPxConversionRate,
            suppressSizeToFit: true,
            idProperty: annot.idProperty,
            field: TabSamplesIlluminaComponent.ANNOTATION_ATTRIBUTE_NAME_PREFIX + annot.idProperty,
            cellEditorFramework: UrlAnnotEditor,
            cellRendererFramework: UrlAnnotRenderer,
            annotation: annot
        };
    }
}

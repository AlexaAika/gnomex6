import {DictionaryService} from "../../services/dictionary.service";

export class Sample {
    public idSample:                        string = ''; // "Sample0";
    public name:                            string = ''; // "asdffdsa";
    public description:                     string = ''; // "";
    public canChangeSampleName:             string = 'Y'; // "Y";
    public canChangeSampleType:             string = 'Y'; // "Y";
    public canChangeSampleConcentration:    string = 'Y'; // "Y";
    public canChangeSampleSource:           string = 'Y'; // "Y";
    public canChangeNumberSequencingCycles: string = 'Y'; // "Y";
    public canChangeNumberSequencingLanes:  string = 'Y'; // "Y";
    public concentration:                   string = ''; // "";
    public label:                           string = ''; // "";
    public idOligoBarcode:                  string = ''; // "";
    public barcodeSequence:                 string = ''; // "";
    public idOligoBarcodeB:                 string = ''; // "";
    public barcodeSequenceB:                string = ''; // "";
    public idNumberSequencingCycles:        string = ''; // "5";
    public idNumberSequencingCyclesAllowed: string = ''; // "69";
    public idSeqRunType:                    string = ''; // "4";
    public numberSequencingLanes:           string = ''; // "1";
    public codeConcentrationUnit:           string = ''; // "ng/ul";
    public idSampleType:                    string = ''; // "1";

    public get sampleType(): any {
        return this._sampleType;
    }
    public set sampleType(value: any) {
        if (value && value.idSampleType) {
            this._sampleType = value;
            this.idSampleType = value.idSampleType;
        }
    }
    private _sampleType: any;

    public idSeqLibProtocol:                string = ''; // "361";
    public seqPrepByCore:                   string = ''; // "Y";
    public idOrganism:                      string = ''; // "204";
    public otherOrganism:                   string = ''; // "";
    public treatment:                       string = ''; // "";
    public customColor:                     string = ''; // "0xFFFFFF";
    public multiplexGroupNumber:            string = ''; // "10";
    public isDirty:                         string = ''; // "Y";

    private _organism: any = {};
    public get organism(): any {
        return this._organism;
    }
    public set organism(value: any) {
        if (value && value.idOrganism) {
            this._organism = value;
            this.idOrganism = value.idOrganism;
        }
    }

    private _sequencingOption: any;
    public get sequencingOption(): any {
        return this._sequencingOption;
    }
    public set sequencingOption(value: any) {
        if (value && value.idNumberSequencingCycles && value.idNumberSequencingCyclesAllowed) {
            this._sequencingOption = value;
            this.idNumberSequencingCycles = value.idNumberSequencingCycles;
            this.idNumberSequencingCyclesAllowed = value.idNumberSequencingCyclesAllowed;
            this.idSeqRunType = value.idSeqRunType;
        }
    }

    private _application: any;
    public get application_object(): any {
        return this._application;
    }
    public set application_object(value: any) {
        this._application = value;

        if (value && value.codeApplication) {
            let lookup = this.dictionaryService.getProtocolFromApplication(value.codeApplication);

            if (lookup && lookup.idSeqLibProtocol) {
                this.idSeqLibProtocol = lookup.idSeqLibProtocol;
            } else {
                this.idSeqLibProtocol = '';
            }
        } else {
            this.idSeqLibProtocol = '';
        }
    }

    constructor(private dictionaryService: DictionaryService) { }

    // extra variables for grid stuff?  Not needed back-end.
    public index: number;
    public prepInstructions: string; // ???
    public frontEndGridGroup: string;

    [prop: string]: any;

    public getJSONObjectRepresentation(): any {

        let temp: any = {
            idSample:                        this.idSample,
            name:                            this.name,
            description:                     this.description,
            canChangeSampleName:             this.canChangeSampleName,
            canChangeSampleType:             this.canChangeSampleType,
            canChangeSampleConcentration:    this.canChangeSampleConcentration,
            canChangeSampleSource:           this.canChangeSampleSource,
            canChangeNumberSequencingCycles: this.canChangeNumberSequencingCycles,
            canChangeNumberSequencingLanes:  this.canChangeNumberSequencingLanes,
            concentration:                   this.concentration,
            label:                           this.label,
            idOligoBarcode:                  this.idOligoBarcode,
            barcodeSequence:                 this.barcodeSequence,
            idOligoBarcodeB:                 this.idOligoBarcodeB,
            barcodeSequenceB:                this.barcodeSequenceB,
            idNumberSequencingCycles:        this.idNumberSequencingCycles,
            idNumberSequencingCyclesAllowed: this.idNumberSequencingCyclesAllowed,
            idSeqRunType:                    this.idSeqRunType,
            numberSequencingLanes:           this.numberSequencingLanes,
            codeConcentrationUnit:           this.codeConcentrationUnit,
            idSampleType:                    this.idSampleType,
            idSeqLibProtocol:                this.idSeqLibProtocol,
            seqPrepByCore:                   this.seqPrepByCore,
            idOrganism:                      this.idOrganism,
            otherOrganism:                   this.otherOrganism,
            treatment:                       this.treatment,
            customColor:                     this.customColor,
            multiplexGroupNumber:            this.multiplexGroupNumber,
            isDirty:                         this.isDirty
        };

        for (let key of Object.keys(this)) {
            if (key.startsWith("ANNOT")) {
                temp[key] = this[key];
            }
        }

        return temp;
    }
}
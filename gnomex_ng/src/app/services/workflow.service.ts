
import {Injectable} from "@angular/core";
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs/Observable";
import {HttpParams} from "@angular/common/http";
import {DictionaryService} from "./dictionary.service";

@Injectable()
export class WorkflowService {
    public readonly ILLUMINA_SEQQC = "ILLSEQQC";
    public readonly ILLSEQ_PREP = "ILLSEQPREP";
    public readonly ILLSEQ_PREP_QC = "ILLSEQPREPQC";
    public readonly ILLSEQ_CLUSTER_GEN = "ILLSEQASSEM";
    public readonly ILLSEQ_FINALIZE_FC = "ILLSEQFINFC";
    public readonly QC = "QC";
    public readonly MICROARRAY = "MICROARRAY";
    public readonly NANOSTRING = "NANO";
    public readonly ALL = "ALL";
    public assmGridRowClassRules: any;
    public static readonly COLOR = '#f1eed6';
    public static readonly OFFCOLOR = 'white';

    public readonly workflowCompletionStatus = [
        {display: '', value: ''},
        {display: 'In Progress', value: 'In Progress'},
        {display: 'Complete', value: 'Completed'},
        {display: 'On Hold', value: 'On Hold'},
        {display: 'Terminate', value: 'Terminated'},
        {display: 'Bypass', value: 'Bypassed'}
    ];


    constructor(private http: Http,
                private dictionaryService: DictionaryService) {

        this.assmGridRowClassRules = {
            "workFlowOnColor": "data.backgroundColor === 'ON' && !data.selected",
            "workFlowOffColor": "data.backgroundColor === 'OFF' && !data.selected",
            "workFlowSelectedColor": "data.selected",
        };
    }

    /**
     *  Alternate background colors in the grid of items.
     * @param {any[]} items
     */
    assignBackgroundColor (items: any[]) {
        let first: boolean = true;
        let previousId: string = "";
        let previousColor: string = "";

        for (let wi of items) {
            if (first) {
                wi.backgroundColor = 'ON';
                first = false;
            } else {
                if (wi.idRequest === previousId) {
                    wi.backgroundColor = previousColor;
                } else {
                    if (previousColor === 'ON') {
                        wi.backgroundColor = 'OFF';
                    } else {
                        wi.backgroundColor = 'ON';
                    }
                }
            }
            previousId = wi.idRequest;
            previousColor = wi.backgroundColor;
        }
    }

    public sortSampleNumber = (item1, item2) => {
        let n1: string = item1.sampleNumber;
        let n2: string = item2.sampleNumber;

        let parts: any[] = n1.split("X");
        let num1: string = parts[0];
        let rem1: string = parts[1];
        let firstChar1: string = num1.substr(0, 1);
        if ("0123456789".indexOf(firstChar1) >= 0) {
            firstChar1 = "0";
        } else {
            num1 = num1.substr(1);
        }

        parts = n2.split("X");
        let num2: string = parts[0];
        let rem2: string = parts[1];
        let firstChar2: string = num2.substr(0, 1);
        if ("0123456789".indexOf(firstChar2) >= 0) {
            firstChar2 = "0";
        } else {
            num2 = num2.substr(1);
        }

        let comp: number = WorkflowService.stringCompare(firstChar1, firstChar2);

        if (comp == 0) {
            let number1: number = Number(num1);
            let number2: number = Number(num2);
            if (number1 > number2) {
                comp = 1;
            } else if (number2 > number1) {
                comp = -1;
            }
        }

        if (comp == 0) {
            let remNum1: number = Number(rem1);
            let remNum2: number = Number(rem2);
            if (remNum1 > remNum2) {
                comp = 1
            } else if (remNum2 > remNum1) {
                comp = -1;
            }
        }

        return comp;
    };

    private static stringCompare(s1: string, s2:string): number {
        if (s1 > s2) {
            return 1;
        } else if (s2 > s1) {
            return -1;
        } else {
            return 0;
        }
    }

    getWorkItemList(params: URLSearchParams):  Observable<any> {
        return this.http.get("/gnomex/GetWorkItemList.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });

    }

    saveCombinedWorkItemQualityControl(params: URLSearchParams):  Observable<any> {
        return this.http.get("/gnomex/SaveCombinedWorkItemQualityControl.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });

    }

    saveWorkItemSolexaPrepQC(params: URLSearchParams):  Observable<any> {
        return this.http.get("/gnomex/SaveWorkItemSolexaPrepQC.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });

    }

    saveWorkItemSolexaPrep(params: URLSearchParams):  Observable<any> {
        return this.http.get("/gnomex/SaveWorkItemSolexaPrep.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });

    }

    deleteWorkItem(params: URLSearchParams):  Observable<any> {
        return this.http.get("/gnomex/DeleteWorkItem.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });

    }

    getCoreAdmins(params: URLSearchParams):  Observable<any> {
        return this.http.get("/gnomex/GetCoreAdmins.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });

    }

    saveWorkItemSolexaAssemble(params: URLSearchParams):  Observable<any> {
        return this.http.get("/gnomex/SaveWorkItemSolexaAssemble.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });

    }

}
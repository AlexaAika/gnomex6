import {Injectable} from "@angular/core";
import {Http, Response, URLSearchParams} from "@angular/http";
import {Observable} from "rxjs/Observable";

import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';

@Injectable()
export class LabListService {

    constructor(private http: Http) {
    }

    public getLabListCall(): Observable<Response> {
        let params: URLSearchParams = new URLSearchParams();
        params.set("listKind", "UnboundedLabList");
        return this.http.get("/gnomex/GetLabList.gx", {search: params});
    }

    public getLabList(): Observable<any[]> {
        return this.getLabListCall().map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                return [];
            }
        });
    }

    public getSubmitRequestLabList(): Observable<any[]> {
        return this.getLabListCall().map((response: Response) => {
            if (response.status === 200) {
                let allLabs: any[] = response.json();
                return allLabs.filter((lab: any) => {
                    return lab.canGuestSubmit === "Y" || lab.canSubmitRequests === "Y";
                });
            } else {
                return [];
            }
        });
    }

}
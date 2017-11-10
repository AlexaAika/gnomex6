import {Injectable} from "@angular/core";
import {Http, Response, URLSearchParams} from "@angular/http";
import {Observable} from "rxjs/Observable";

import 'rxjs/add/operator/map';

@Injectable()
export class LaunchPropertiesService {
    constructor(private http: Http) {
    }

    /**
     * Return the Launch Properties
     * @param {URLSearchParams} params
     * @returns {Observable<any>}
     */
    getLaunchProperties(params: URLSearchParams): Observable<any> {
        return this.http.get("/gnomex/GetLaunchProperties.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });
    }
}
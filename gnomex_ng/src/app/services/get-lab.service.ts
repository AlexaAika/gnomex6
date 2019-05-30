import {Injectable} from "@angular/core";
import {Http, Response, URLSearchParams} from "@angular/http";
import {BehaviorSubject, Observable} from "rxjs";
import {HttpClient, HttpParams} from "@angular/common/http";
import {first, map} from "rxjs/operators";
import {UtilService} from "./util.service";

@Injectable()
export class GetLabService {

    public get labSubmittersObservable(): Observable<any[]> {
        return this._labSubmitters_subject.asObservable();
    }

    private _labSubmitters_subject: BehaviorSubject<any[]> = new BehaviorSubject([]);

    public labMembersSubject: BehaviorSubject<any[]> = new BehaviorSubject([]);


    constructor(private http: Http,
                private httpClient: HttpClient) {

    }




    public getLabCall(params: HttpParams): Observable<any> {
        return this.httpClient.get("/gnomex/GetLab.gx", {params: params});
    }


    public  sortLabMembersFn = (obj1, obj2) =>{
        if (!obj1 && !obj2) {
            return 0;
        } else if (!obj1) {
            return 1;
        } else if (!obj2) {
            return -1;
        } else {
            var display1:String = obj1.displayName;
            var display2:String = obj2.displayName;

            if (display1.toLowerCase() < display2.toLowerCase()) {
                return -1;
            } else if (display1.toLowerCase() > display2.toLowerCase()) {
                return 1;
            } else {
                return 0;
            }
        }
    };


    getSubmittersForLab(idLab: string, includeBillingAccounts: string, includeProductCounts: string): Observable<any[]> {
        // explicitly want to give them the observable (see end of function) before processing the http call
        setTimeout(() => {

            let params: HttpParams = new HttpParams()
                .set("idLab", idLab)
                .set("includeBillingAccounts", includeBillingAccounts)
                .set("includeProductCounts", includeProductCounts);

            this.httpClient.get("/gnomex/GetLab.gx", { params: params }).pipe(first()).subscribe((response: any) => {

                if (!response) {
                    return;
                }

                let lab: any = response.Lab;

                if (lab) {
                    let possibleSubmittersForLabDictionary = [];
                    let temp: any[] = [];

                    if (lab.members) {
                        if (!Array.isArray(lab.members)) {
                            temp = [lab.members.AppUser];
                        } else {
                            temp = lab.members;
                        }
                    }

                    for (let member of temp) {
                        possibleSubmittersForLabDictionary.push(member);
                    }

                    if (lab.managers) {
                        if (!Array.isArray(lab.managers)) {
                            temp = [lab.managers.AppUser];
                        } else {
                            temp = lab.managers;
                        }
                    }

                    for (let manager of temp) {
                        let managerFoundInAppUsers: boolean = false;

                        for (let appUser of possibleSubmittersForLabDictionary) {
                            if (appUser.idAppUser === manager.idAppUser) {
                                managerFoundInAppUsers = true;
                                break;
                            }
                        }

                        if (!managerFoundInAppUsers) {
                            possibleSubmittersForLabDictionary.push(manager);
                        }
                    }

                    this._labSubmitters_subject.next(possibleSubmittersForLabDictionary);
                }
            });
        });

        return this.labSubmittersObservable;
    }


    getLabMembers_fromBackend(params: URLSearchParams): void {

        this.http.get("/gnomex/GetLab.gx", { search: params}).subscribe((response: Response) => {
            if (response.status === 200) {
                let lab: any = response.json().Lab;
                if (lab) {
                    let members: Array<any> = Array.isArray(lab.members) ? lab.members : [lab.members.AppUser];
                    let activeMembers:Array<any> = members.filter(appUser => appUser.isActive === 'Y');
                    let sortedActiveMembers = activeMembers.sort(this.sortLabMembersFn);
                    this.labMembersSubject.next(sortedActiveMembers);
                }
            } else {
                throw new Error("Error");
            }
        });
    }
    getLab(params: HttpParams): Observable<any> {
        return this.httpClient.get("/gnomex/GetLab.gx", {params: params});
    }

    public getLabNew(params: HttpParams): Observable<any> {
        return this.httpClient.get("/gnomex/GetLab.gx", {params: params});
    }

    public getLabProjects(idLab: string): Observable<any[]> {
        let params: HttpParams = new HttpParams()
            .set("idLab", idLab)
            .set("includeBillingAccounts", "N")
            .set("includeProductCounts", "N")
            .set("includeProjects", "Y")
            .set("includeCoreFacilities", "N")
            .set("includeHistoricalOwnersAndSubmitters", "N")
            .set("includeInstitutions", "N")
            .set("includeSubmitters", "N")
            .set("includeMoreCollaboratorInfo", "N");
        return this.getLabNew(params).pipe(map((response: any) => {
            if (response && response.Lab && response.Lab.projects) {
                return UtilService.getJsonArray(response.Lab.projects, response.Lab.projects.Project);
            } else {
                return [];
            }
        }));
    }

    deleteLab(params: URLSearchParams): Observable<any> {
        return this.http.get("/gnomex/DeleteLab.gx", {search: params}).pipe(map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        }));
    }

    getLabById(idLab: string): Observable<any> {
        let params: HttpParams = new HttpParams().set("idLab", idLab);
        return this.getLab(params);
    }

    public getLabByIdOnlyForHistoricalOwnersAndSubmitters(idLab: string): Observable<any> {
        let params: HttpParams = this.makeParams(idLab, false, false, false, false, true, false, false, false);
        return this.getLab(params);
    }

    public getLabBillingAccounts(idLab: string): Observable<any> {
        let params: HttpParams = this.makeParams(idLab, true, false, false, false, false, false, false, false);
        return this.getLab(params);
    }

    public getLabBasic(idLab: string): Observable<Response> {
        let params: HttpParams = this.makeParams(idLab, false, false, false, false, false, false, false, false);
        return this.getLabCall(params);
    }

    public getExperimentPickList(params: HttpParams): Observable<any> {
        return this.httpClient.get("/gnomex/GetExperimentPickList.gx", {params: params});
    }

    public getLabMembers(idLab: string): Observable<any[]> {
        return this.getLabBasic(idLab).pipe(map((response: Response) => {
            if (response.status === 200) {
                let lab = response.json();
                return UtilService.getJsonArray(lab.Lab.members, lab.Lab.members.AppUser);
            } else {
                return [];
            }
        }));
    }

    private makeParams(idLab: string, includeBillingAccounts: boolean, includeProductCounts: boolean,
                       includeProjects: boolean, includeCoreFacilities: boolean, includeHistoricalOwnersAndSubmitters: boolean,
                       includeInstitutions: boolean, includeSubmitters: boolean, includeMoreCollaboratorInfo: boolean): HttpParams {

        let params: HttpParams = new HttpParams()
            .set("idLab", idLab)
            .set("includeBillingAccounts", includeBillingAccounts ? "Y" : "N")
            .set("includeProductCounts", includeProductCounts ? "Y" : "N")
            .set("includeProjects", includeProjects ? "Y" : "N")
            .set("includeCoreFacilities", includeCoreFacilities ? "Y" : "N")
            .set("includeHistoricalOwnersAndSubmitters", includeHistoricalOwnersAndSubmitters ? "Y" : "N")
            .set("includeInstitutions", includeInstitutions ? "Y" : "N")
            .set("includeSubmitters", includeSubmitters ? "Y" : "N")
            .set("includeMoreCollaboratorInfo", includeMoreCollaboratorInfo ? "Y" : "N");
        return params;
    }

}
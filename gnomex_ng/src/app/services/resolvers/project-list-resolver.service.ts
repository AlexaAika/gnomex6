import {Injectable} from '@angular/core'
import {Resolve, ActivatedRouteSnapshot, ActivatedRoute} from '@angular/router'
import {ExperimentsService} from '../../experiments/experiments.service'
import {URLSearchParams} from "@angular/http";

/* This service will be used in experiment.routes.ts and when injecting ActivateRoute  into browse-overview.component.ts
 we can get the project json off the route */

@Injectable()
export class ProjectListResolverService implements Resolve<any> {
    constructor(private experimentsService: ExperimentsService) {
    }

    resolve(route: ActivatedRouteSnapshot) { // resolve is good with asyncrous data, it waits to load component till data is ready

        let ids: URLSearchParams = new URLSearchParams;
        let idProject = route.params["idProject"];

        ids.set('idProject', idProject );
        ids.set("showEmptyProjectFolders", "N" );
        ids.set("showCategory", "N");
        ids.set("showSamples", "N");

        this.experimentsService.browsePanelParams = ids;

        if(idProject){
            return this.experimentsService.getProjectRequestList(ids);
        }

    }
}
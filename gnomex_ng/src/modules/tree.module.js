var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
//import { jqxTreeComponent } from 'jqwidgets-framework';
import { jqxTreeComponent } from '../assets/jqwidgets-ts/angular_jqxtree';
var TreeModule = (function () {
    function TreeModule() {
    }
    return TreeModule;
}());
TreeModule = __decorate([
    NgModule({
        imports: [CommonModule],
        declarations: [jqxTreeComponent],
        exports: [jqxTreeComponent],
    })
], TreeModule);
export { TreeModule };
//# sourceMappingURL=tree.module.js.map
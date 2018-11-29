import {Component, OnInit} from "@angular/core";
import {AuthenticationService} from "./authentication.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {GnomexService} from "../services/gnomex.service";

@Component({
    selector: "hci-login-form",
    template: `
        <div class="container">
            <div class="login-box login-background" id="hci-login-form-box">
                <div class="login-heading" id="hci-login-form-heading">
                    <h3>Sign in</h3>
                </div>
                <div class="panel-body login-background">
                    <form [formGroup]="_loginForm">
                        <input formControlName="username" class="form-control" id="username" name="username"
                               placeholder="Username" type="text">
                        <input formControlName="password" class="form-control" id="password" name="password"
                               type="password" placeholder="Password">

                        <div *ngIf="_errorMsg" class="alert-box">
                            <div class="alert alert-danger">
                                <h5 class="alert-heading">Authentication Failed</h5>
                                <span id="hci-login-error" class="alert-text">{{_errorMsg}}</span>
                            </div>
                        </div>

                        <div class="btn-box">
                            <button class="btn btn-primary" id="hci-login-form-submit-button" (click)="this.login()"
                                    [disabled]="!_loginForm.valid">Login
                            </button>
                        </div>
                        <div class="btn-box" >
                            <a  (click)="this.guestLogin()"> Guest Login </a>
                            <a [routerLink]="['/register-user']" > New Account </a>
                        </div>
                        
                        
                    </form>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .container {
            max-width: 400px;
            margin-top: 20px;
            padding-top: 15px;
        }

        .login-box {
            border-radius: 10px;
            box-shadow: 0 0 2px #ccc;
            padding: 15px;
        }

        .login-box .login-heading h3 {
            line-height: 1.5;
            margin: 0 0 10px
        }

        .login-box .form-control {
            padding: 10px;
            border: 1px solid #ccc;
        }

        .login-box input[type="password"] {
            margin-bottom: 10px;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }

        .login-box input[type="text"] {
            margin-bottom: -1px;
            border-bottom-right-radius: 0;
            border-bottom-left-radius: 0;
        }

        .login-box .alert-box {
            margin: 10px 0 -5px 0
        }

        .login-box .alert-text {
            font-size: small;
        }

        .login-box .btn-box {
            margin: 10px 0 0px 0
        }
    `]
})
export class DirectLoginComponent implements OnInit {
    public _loginForm: FormGroup;
    public _errorMsg: string;

    constructor(private _authenticationService: AuthenticationService, private _formBuilder: FormBuilder,
                private router: Router, private gnomexService: GnomexService) {
    }

    /**
     * Initializes the authentication form.
     */
    ngOnInit(): void {
        this._loginForm = this._formBuilder.group({
            username: ["", Validators.required],
            password: ["", Validators.required]
        });
    }

    /**
     * A function to submit the login form the the {@link UserService}.
     */
    login() {
        this._authenticationService.login(this._loginForm.value.username, this._loginForm.value.password)
            .subscribe((res) => {
                if (res) {
                    this._errorMsg = null;
                    this._authenticationService.requestAccessToken(true);
                }
            }, (error: any) => {
                this._errorMsg = "Please check your username and password.";
            });
    }

    guestLogin(): void {
        this._authenticationService.guestLogin();
        this.router.navigateByUrl("home");
    }
}

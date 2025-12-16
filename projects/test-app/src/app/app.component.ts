import { Component, effect, inject, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { _, TranslateService, TranslationObject } from "@ngx-translate/core";
import { map } from "rxjs";
import { LanguageSwitchComponent } from "./components/language-switch/language-switch.component";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [
        RouterModule,

        // Components
        LanguageSwitchComponent,
    ],
    templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
    private translate = inject(TranslateService);

    title = _("test-app");

    onTranslationChange = effect(() => {
        const event = this.translate.$onTranslationChange();
        console.log("AppComponent - onTranslationChange", event);
    });

    ngOnInit() {
        // Service Get method with a set of string[]
        this.translate
            .get(["demo.simple.text-as-attribute", "demo.simple.text-as-content"])
            .pipe(
                map((arr: TranslationObject) => {
                    return Object.values(arr).join(", ");
                }),
            )
            .subscribe((result: string) => {
                console.info(".get([])", result);

                const instantTranslation = this.translate.instant("demo.simple.text-as-attribute");
                console.info("instant", instantTranslation);
            });
    }

    reloadLang() {
        this.translate.reloadLang(this.translate.$currentLang()).subscribe((translations) => {
            console.info("reloadLang", translations);
        });
    }
}

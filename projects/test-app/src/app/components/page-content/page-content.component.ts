import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TranslateDirective, TranslatePipe, TranslateService } from "@ngx-translate/core";
import { StandaloneComponent } from "../standalone/standalone.component";

@Component({
    selector: "app-page-content",
    imports: [
        // Components
        StandaloneComponent,

        // Vendors
        TranslateDirective,
        TranslatePipe,

        // Mat
        FormsModule,
        ReactiveFormsModule,
    ],
    templateUrl: "./page-content.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageContentComponent {
    private readonly translate = inject(TranslateService);

    $textAsSignal = this.translate.$stream(
        "demo.simple.text-as-signal",
        {},
        { initialValue: "..." },
    );
}

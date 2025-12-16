import { ChangeDetectorRef, effect, inject, Injectable, Pipe, PipeTransform } from "@angular/core";
import { isObservable } from "rxjs";
import { TranslateService } from "./translate.service";
import {
    InterpolatableTranslationObject,
    InterpolationParameters,
    StrictTranslation,
} from "./translate.service.interface";
import { equals, isDefinedAndNotNull, isDict, isString } from "./util";

@Injectable()
@Pipe({
    name: "translate",
    standalone: true,
    pure: false, // required to update the value when the promise is resolved
})
export class TranslatePipe implements PipeTransform {
    protected translate: TranslateService = inject(TranslateService);
    protected _ref: ChangeDetectorRef = inject(ChangeDetectorRef);

    protected value: StrictTranslation = "";
    lastKey: string | null = null;
    lastParams: InterpolationParameters[] = [];

    interpolateParams: InterpolationParameters | undefined = undefined;

    updateValue(key: string, translations?: InterpolatableTranslationObject): void {
        const onTranslation = (res: StrictTranslation) => {
            this.value = res !== undefined ? res : key;
            this.lastKey = key;
            this._ref.markForCheck();
        };
        if (translations) {
            const res = this.translate.getParsedResult(key, this.interpolateParams);
            if (isObservable(res)) {
                res.subscribe(onTranslation);
            } else {
                onTranslation(res);
            }
        }
        this.translate.get(key, this.interpolateParams).subscribe(onTranslation);
    }

    onLangChange = effect(() => {
        const event = this.translate.$onLangChange();
        const query = this.lastKey;

        if (query) {
            this.lastKey = null; // we want to make sure it doesn't return the same value until it's been updated
            this.updateValue(query, event.translations);
        }
    });
    onTranslationChange = effect(() => {
        const event = this.translate.$onTranslationChange();
        const query = this.lastKey;

        if (
            query &&
            (event.lang === this.translate.$currentLang() ||
                event.lang === this.translate.$fallbackLang())
        ) {
            this.lastKey = null;
            this.updateValue(query, event.translations);
        }
    });
    onFallbackLangChange = effect(() => {
        const event = this.translate.$onFallbackLangChange();
        const query = this.lastKey;

        if (query) {
            this.lastKey = null; // we want to make sure it doesn't return the same value until it's been updated
            this.updateValue(query, event.translations);
        }
    });

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    transform(query: string | undefined | null, ...args: any[]): any {
        if (!query || !query.length) {
            return query;
        }

        // if we ask another time for the same key, return the last value
        if (equals(query, this.lastKey) && equals(args, this.lastParams)) {
            return this.value;
        }

        if (isDefinedAndNotNull(args[0]) && args.length) {
            if (isString(args[0]) && args[0].length) {
                // we accept objects written in the template such as {n:1}, {'n':1}, {n:'v'}
                // this is why we might need to change it to real JSON objects such as {"n":1} or {"n":"v"}
                const validArgs: string = args[0]
                    .replace(/(')?([a-zA-Z0-9_]+)(')?(\s)?:/g, '"$2":')
                    .replace(/:(\s)?(')(.*?)(')/g, ':"$3"');
                try {
                    this.interpolateParams = JSON.parse(validArgs);
                } catch (e) {
                    void e;
                    throw new SyntaxError(
                        `Wrong parameter in TranslatePipe. Expected a valid Object, received: ${args[0]}`,
                    );
                }
            } else if (isDict(args[0])) {
                this.interpolateParams = args[0];
            }
        }

        // store the query in case it changes
        this.lastKey = query;

        // store the params in case they change
        this.lastParams = args;

        // set the value
        this.updateValue(query, this.interpolateParams);

        return this.value;
    }
}

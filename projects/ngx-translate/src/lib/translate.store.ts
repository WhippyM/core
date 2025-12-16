import { Injectable, signal } from "@angular/core";
import { Observable, Subject } from "rxjs";
import {
    FallbackLangChangeEvent,
    InterpolatableTranslation,
    InterpolatableTranslationObject,
    LangChangeEvent,
    Language,
    TranslationChangeEvent,
} from "./translate.service.interface";
import { getValue, mergeDeep } from "./util";

export type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

@Injectable()
export class TranslateStore {
    /**
     * Deprecates: Signal migration
     */
    /** @deprecated use `$onTranslationChange signal instead` */
    protected _onTranslationChange: Subject<TranslationChangeEvent> =
        new Subject<TranslationChangeEvent>();
    /** @deprecated use `$onLangChange signal instead` */
    protected _onLangChange: Subject<LangChangeEvent> = new Subject<LangChangeEvent>();
    /** @deprecated use `$onFallbackLangChange signal instead` */
    protected _onFallbackLangChange: Subject<FallbackLangChangeEvent> =
        new Subject<FallbackLangChangeEvent>();

    /** @deprecated use `$translations signal instead` */
    protected translations: Record<Language, InterpolatableTranslationObject> = {};
    /** @deprecated use `$fallbackLang signal instead` */
    protected fallbackLang: Language | null = null;
    /** @deprecated use `$currentLang signal instead` */
    protected currentLang!: Language;
    /** @deprecated use `$languages signal instead` */
    protected languages: Language[] = [];

    /**
     * Signals
     */
    $translations = signal<Record<Language, InterpolatableTranslationObject>>({});
    $fallbackLang = signal<Language | null>(null);
    $currentLang = signal<Language>("");
    $languages = signal<Language[]>([]);

    $onTranslationChange = signal<TranslationChangeEvent>({ lang: "", translations: {} });
    $onLangChange = signal<LangChangeEvent>({ lang: "", translations: {} });
    $onFallbackLangChange = signal<FallbackLangChangeEvent>({ lang: "", translations: {} });

    public getTranslations(language: Language): DeepReadonly<InterpolatableTranslationObject> {
        return this.$translations()[language];
    }

    public setTranslations(
        language: Language,
        translations: InterpolatableTranslationObject,
        extend: boolean,
    ): void {
        this.translations[language] =
            extend && this.hasTranslationFor(language)
                ? mergeDeep(this.translations[language], translations)
                : translations;
        this._onTranslationChange.next({
            lang: language,
            translations: this.getTranslations(language),
        });

        this.$translations.update((current) => {
            const updated =
                extend && current[language]
                    ? mergeDeep(current[language], translations)
                    : translations;
            return {
                ...current,
                [language]: updated,
            };
        });
        this.addLanguages([language]);
        this.$onTranslationChange.set({
            lang: language,
            translations: this.getTranslations(language),
        });
    }

    /**
     * Changes the fallback lang
     */
    public setFallbackLang(lang: string, emitChange = true): void {
        this.fallbackLang = lang;
        this.$fallbackLang.set(lang);

        if (emitChange) {
            this._onFallbackLangChange.next({ lang: lang, translations: this.translations[lang] });
            this.$onFallbackLangChange.set({ lang: lang, translations: this.translations[lang] });
        }
    }

    public setCurrentLang(lang: string, emitChange = true): void {
        this.currentLang = lang;
        this.$currentLang.set(lang);

        if (emitChange) {
            this._onLangChange.next({ lang: lang, translations: this.translations[lang] });
            this.$onLangChange.set({ lang: lang, translations: this.translations[lang] });
        }
    }

    public addLanguages(languages: Language[]): void {
        this.languages = Array.from(new Set([...this.languages, ...languages]));

        const newLanguages = languages.filter((lang) => !this.$languages().includes(lang));
        if (!newLanguages) {
            return;
        }

        this.$languages.update((values) => {
            return [...values, ...newLanguages];
        });
    }

    public hasTranslationFor(lang: string) {
        return typeof this.$translations()[lang] !== "undefined";
    }

    public deleteTranslations(lang: string) {
        delete this.$translations()[lang];
    }

    public getTranslation(key: string): InterpolatableTranslation {
        let text = this.getValue(this.$currentLang(), key);
        const fallbackLang = this.$fallbackLang();

        if (
            (text === undefined || text === null) &&
            fallbackLang != null &&
            fallbackLang !== this.$currentLang()
        ) {
            text = this.getValue(fallbackLang, key);
        }
        return text;
    }

    protected getValue(language: Language, key: string): InterpolatableTranslation {
        return getValue(this.getTranslations(language), key) as InterpolatableTranslation;
    }

    /** @deprecated access $languages directly */
    public getLanguages(): readonly Language[] {
        return this.$languages();
    }

    /** @deprecated access $currentLang directly */
    public getCurrentLang(): Language {
        return this.$currentLang();
    }

    /** @deprecated access $fallbackLang directly */
    public getFallbackLang(): Language | null {
        return this.$fallbackLang();
    }

    /**
     * An Observable to listen to translation change events
     * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
     *     // do something
     * });
     * @deprecated use compute `$onTranslationChange` instead
     */
    get onTranslationChange(): Observable<TranslationChangeEvent> {
        return this._onTranslationChange.asObservable();
    }

    /**
     * An Observable to listen to lang change events
     * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
     * @deprecated use compute `$currentLang` instead
     */
    get onLangChange(): Observable<LangChangeEvent> {
        return this._onLangChange.asObservable();
    }

    /**
     * An Observable to listen to fallback lang change events
     * onFallbackLangChange.subscribe((params: FallbackLangChangeEvent) => {
     *     // do something
     * });
     * @deprecated use compute `$fallbackLang` instead
     */
    get onFallbackLangChange(): Observable<FallbackLangChangeEvent> {
        return this._onFallbackLangChange.asObservable();
    }
}

<script lang="ts">
    import { enhance } from "$app/forms";
    import { resolve } from "$app/paths";
    import { untrack } from "svelte";
    import type { ActionData } from "./$types";
    import Icon from "$lib/components/Icon.svelte";
    import ChoiceCard from "$lib/components/ChoiceCard.svelte";
    import Stepper from "$lib/components/Stepper.svelte";
    import Stamp from "$lib/components/Stamp.svelte";
    import FootnoteBar from "$lib/components/FootnoteBar.svelte";
    import { locale } from "$lib/i18n/locale";
    import { translations, type TranslationKey } from "$lib/i18n/translations";
    import { formatTemplate, translate } from "$lib/i18n/translate";
    import {
        classificationTypes,
        defaultItemKindForClassification,
        getAllowedItemKinds,
        isItemKindAllowedForClassification,
        type ClassificationType,
        type ItemKind,
    } from "$lib/ingestion/kindMappings";

    let { form } = $props<{ form: ActionData }>();

    const dictionary = $derived(translations[$locale]);
    const t = (key: TranslationKey) => translate(dictionary, key);

    // --- form state ---
    let name = $state("");
    let selectedClassificationType = $state<ClassificationType>("document");
    let selectedItemKind = $state<ItemKind>(
        defaultItemKindForClassification("document"),
    );
    let selectedLang = $state("fa");
    let selectedPreset = $state("auto");
    let selectedVisibility = $state("private");
    let tagsInput = $state("");
    let summaryTags = $state<string[]>([]);
    let notes = $state("");
    let submitting = $state(false);

    type KindOption = {
        id: ItemKind;
        icon: string;
        label: string;
        sub: string;
    };
    const itemKindOptions = $derived<KindOption[]>([
        {
            id: "scanned_document",
            icon: "pages",
            label: t("ingestionNew.itemKinds.scannedDocument.label"),
            sub: t("ingestionNew.itemKinds.scannedDocument.sub"),
        },
        {
            id: "photo",
            icon: "image",
            label: t("ingestionNew.itemKinds.photo.label"),
            sub: t("ingestionNew.itemKinds.photo.sub"),
        },
        {
            id: "audio",
            icon: "audio",
            label: t("ingestionNew.itemKinds.audio.label"),
            sub: t("ingestionNew.itemKinds.audio.sub"),
        },
        {
            id: "video",
            icon: "video",
            label: t("ingestionNew.itemKinds.video.label"),
            sub: t("ingestionNew.itemKinds.video.sub"),
        },
        {
            id: "document",
            icon: "file",
            label: t("ingestionNew.itemKinds.document.label"),
            sub: t("ingestionNew.itemKinds.document.sub"),
        },
        {
            id: "other",
            icon: "file",
            label: t("ingestionNew.itemKinds.other.label"),
            sub: t("ingestionNew.itemKinds.other.sub"),
        },
    ]);

    const classificationLabel = (id: ClassificationType): string =>
        id === "image"
            ? t("ingestionNew.classifications.image")
            : t(`ingestionSetup.classificationTypes.${id}`);

    type ClassificationOption = {
        id: ClassificationType;
        icon: string;
        label: string;
    };
    const classificationTypeOptions = $derived<ClassificationOption[]>([
        { id: "newspaper_article", icon: "pages", label: classificationLabel("newspaper_article") },
        { id: "magazine_article", icon: "pages", label: classificationLabel("magazine_article") },
        { id: "book_chapter", icon: "book", label: classificationLabel("book_chapter") },
        { id: "book", icon: "book", label: classificationLabel("book") },
        { id: "letter", icon: "manuscript", label: classificationLabel("letter") },
        { id: "speech", icon: "audio", label: classificationLabel("speech") },
        { id: "interview", icon: "audio", label: classificationLabel("interview") },
        { id: "report", icon: "file", label: classificationLabel("report") },
        { id: "manuscript", icon: "manuscript", label: classificationLabel("manuscript") },
        { id: "image", icon: "image", label: classificationLabel("image") },
        { id: "document", icon: "file", label: classificationLabel("document") },
        { id: "other", icon: "file", label: classificationLabel("other") },
    ]);

    type LangDef = { id: string; label: string; native: string };
    const languages = $derived<LangDef[]>([
        { id: "fa", label: t("ingestionSetup.languages.persian"), native: "فارسی" },
        { id: "tg", label: t("ingestionSetup.languages.tajik"), native: "Тоҷикӣ" },
        { id: "en", label: t("ingestionSetup.languages.english"), native: "English" },
        { id: "ru", label: t("ingestionSetup.languages.ru"), native: "Русский" },
        { id: "mixed", label: t("ingestionNew.languages.mixed"), native: t("ingestionNew.languages.mixedNative") },
        { id: "unknown", label: t("ingestionNew.languages.unknown"), native: t("ingestionNew.languages.unknownNative") },
    ]);

    type PresetDef = { id: string; label: string; sub: string };
    const presets = $derived<PresetDef[]>([
        {
            id: "auto",
            label: t("ingestionNew.presets.auto.label"),
            sub: t("ingestionNew.presets.auto.sub"),
        },
        {
            id: "ocr_text",
            label: t("ingestionNew.presets.ocrText.label"),
            sub: t("ingestionNew.presets.ocrText.sub"),
        },
        {
            id: "audio_transcript",
            label: t("ingestionNew.presets.audioTranscript.label"),
            sub: t("ingestionNew.presets.audioTranscript.sub"),
        },
        {
            id: "video_transcript",
            label: t("ingestionNew.presets.videoTranscript.label"),
            sub: t("ingestionNew.presets.videoTranscript.sub"),
        },
        {
            id: "ocr_and_audio_transcript",
            label: t("ingestionNew.presets.ocrAudio.label"),
            sub: t("ingestionNew.presets.ocrAudio.sub"),
        },
        {
            id: "ocr_and_video_transcript",
            label: t("ingestionNew.presets.ocrVideo.label"),
            sub: t("ingestionNew.presets.ocrVideo.sub"),
        },
        {
            id: "none",
            label: t("ingestionNew.presets.none.label"),
            sub: t("ingestionNew.presets.none.sub"),
        },
    ]);

    const visibilityOptions = $derived([
        { id: "private", label: t("ingestionNew.visibility.private.label"), sub: t("ingestionNew.visibility.private.sub") },
        { id: "family", label: t("ingestionNew.visibility.family.label"), sub: t("ingestionNew.visibility.family.sub") },
        { id: "public", label: t("ingestionNew.visibility.public.label"), sub: t("ingestionNew.visibility.public.sub") },
    ]);

    const errorMessage = $derived(form?.error ?? "");

    const visibleItemKinds = $derived(
        itemKindOptions.filter((kind) =>
            getAllowedItemKinds(selectedClassificationType).includes(kind.id),
        ),
    );

    const visibleClassifications = $derived(
        classificationTypeOptions.filter((c) =>
            classificationTypes.includes(c.id),
        ),
    );

    // Keep the selected item kind compatible with the chosen classification.
    $effect(() => {
        const classificationType = selectedClassificationType;
        const itemKind = untrack(() => selectedItemKind);
        if (!isItemKindAllowedForClassification(classificationType, itemKind)) {
            selectedItemKind =
                defaultItemKindForClassification(classificationType);
        }
    });

    const allowedPresets = $derived(
        new Set<string>(
            (
                {
                    scanned_document: ["auto", "none", "ocr_text"],
                    photo: ["auto", "none"],
                    audio: ["auto", "none", "audio_transcript"],
                    video: [
                        "auto",
                        "none",
                        "video_transcript",
                        "ocr_and_video_transcript",
                    ],
                    document: ["auto", "none"],
                    other: presets.map((p) => p.id),
                } as Record<string, string[]>
            )[selectedItemKind] ?? ["auto", "none"],
        ),
    );

    const suggestedPresetId = $derived(
        (
            {
                scanned_document: "ocr_text",
                photo: "none",
                audio: "audio_transcript",
                video: "video_transcript",
                document: "none",
                other: "auto",
            } as Record<string, string>
        )[selectedItemKind] ?? "auto",
    );

    const suggestedPresetLabel = $derived(
        presets.find((p) => p.id === suggestedPresetId)?.label ?? "",
    );

    // Auto-switch preset to the suggestion when the media category changes.
    // Uses untrack so manual preset picks don't re-trigger.
    $effect(() => {
        const suggested = suggestedPresetId;
        if (!allowedPresets.has(untrack(() => selectedPreset))) {
            selectedPreset = suggested;
        }
    });

    const STEPS = $derived([
        { id: "configure", label: t("ingestionNew.steps.configure") },
        { id: "upload", label: t("ingestionNew.steps.upload") },
        { id: "review", label: t("ingestionNew.steps.review") },
    ]);

    const addTag = () => {
        const t = tagsInput.trim().replace(/^#/, "");
        if (t && !summaryTags.includes(t)) summaryTags = [...summaryTags, t];
        tagsInput = "";
    };

    const removeTag = (tag: string) => {
        summaryTags = summaryTags.filter((t) => t !== tag);
    };
</script>

<!-- Page fills the main column from the layout grid -->
<div class="flex flex-col min-h-full lg:min-h-screen">
    <!-- Sticky top-bar -->
    <header
        class="sticky top-0 z-20 border-b border-border-soft bg-alabaster-grey px-4 py-3 sm:py-4 sm:px-6"
    >
        <div
            class="mx-auto flex w-full max-w-6xl items-start justify-between gap-3 sm:gap-6"
        >
            <div class="flex flex-col gap-1 min-w-0">
                <div class="flex items-center gap-2 text-xs text-text-muted">
                    <span
                        class="text-xs uppercase tracking-[0.2em] text-blue-slate"
                        >{t("header.nav.ingestion")}</span
                    >
                    <Icon name="chevron-r" size={12} />
                    <span>{t("header.nav.newBatch")}</span>
                </div>
                <h1
                    class="font-display text-xl sm:text-2xl text-text-ink m-0 leading-tight truncate"
                >
                    {name.trim() || t("ingestionNew.fallbackTitle")}
                </h1>
            </div>
            <div class="flex flex-shrink-0 items-center gap-2 sm:gap-3 pt-1">
                <span class="hidden sm:flex"
                    ><Stamp>{t("ingestionNew.statusDraft")}</Stamp></span
                >
                <a
                    href={resolve("/ingestion")}
                    aria-label={t("ingestionNew.discard")}
                    class="inline-flex items-center gap-2 rounded-full border border-border-soft px-3 sm:px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:bg-pale-sky/20 hover:text-text-ink transition-all"
                >
                    <span aria-hidden="true"><Icon name="x" size={13} /></span>
                    <span class="hidden sm:inline" aria-hidden="true">{t("ingestionNew.discard")}</span>
                </a>
            </div>
        </div>
    </header>

    <!-- Scrollable body -->
    <form
        id="new-batch-form"
        method="POST"
        class="flex-1 px-4 py-8 sm:px-6"
        use:enhance={() => {
            submitting = true;
            console.log(selectedItemKind, selectedClassificationType);
            return async ({ update }) => {
                await update();
                submitting = false;
            };
        }}
    >
        <!-- Hidden server fields derived from ChoiceCard selections -->
        <input type="hidden" name="itemKind" value={selectedItemKind} />
        <input
            type="hidden"
            name="classificationType"
            value={selectedClassificationType}
        />
        <input type="hidden" name="languageCode" value={selectedLang} />
        <input type="hidden" name="pipelinePreset" value={selectedPreset} />
        <input type="hidden" name="accessLevel" value={selectedVisibility} />
        <input type="hidden" name="summaryTags" value={summaryTags.join(",")} />
        <input type="hidden" name="locale" value={$locale} />

        <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <!-- Batch name -->
            <div class="flex flex-col gap-2">
                <label
                    for="name"
                    class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium"
                    >{t("ingestionNew.fields.nameLabel")}</label
                >
                <input
                    id="name"
                    name="name"
                    type="text"
                    class="w-full border border-border-soft bg-surface-white px-4 py-[10px] text-sm text-text-ink rounded-2xl focus:outline-none focus:border-blue-slate focus:ring-2 focus:ring-blue-slate/25 transition-all"
                    placeholder={t("ingestionNew.fields.namePlaceholder")}
                    bind:value={name}
                />
            </div>

            <!-- Classification type -->
            <div class="flex flex-col gap-3">
                <span
                    class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium"
                    >{t("ingestionNew.sections.classification")}</span
                >
                <div
                    class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
                >
                    {#each visibleClassifications as classification (classification.id)}
                        <ChoiceCard
                            icon={classification.icon}
                            title={classification.label}
                            selected={selectedClassificationType ===
                                classification.id}
                            onclick={() => {
                                selectedClassificationType = classification.id;
                            }}
                        />
                    {/each}
                </div>
            </div>

            <!-- Item kind (filtered by classification type) -->
            <div class="flex flex-col gap-3">
                <span
                    class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium"
                    >{t("ingestionNew.sections.itemKind")}</span
                >
                <div
                    class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6"
                >
                    {#each visibleItemKinds as kind (kind.id)}
                        <ChoiceCard
                            icon={kind.icon}
                            title={kind.label}
                            sub={kind.sub}
                            selected={selectedItemKind === kind.id}
                            onclick={() => {
                                selectedItemKind = kind.id;

                                console.log(kind.id, selectedItemKind);
                            }}
                        />
                    {/each}
                </div>
            </div>

            <!-- Language -->
            <div class="flex flex-col gap-3">
                <span
                    class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium"
                    >{t("intent.language")}</span
                >
                <div class="grid grid-cols-3 gap-2 md:grid-cols-6">
                    {#each languages as lang (lang.id)}
                        <ChoiceCard
                            title={lang.label}
                            native={lang.native}
                            selected={selectedLang === lang.id}
                            onclick={() => {
                                selectedLang = lang.id;
                            }}
                        />
                    {/each}
                </div>
            </div>

            <!-- Pipeline preset -->
            <div class="flex flex-col gap-3">
                <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span
                        class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium"
                        >{t("ingestionNew.sections.pipeline")}</span
                    >
                    <span class="text-xs text-text-muted"
                        >{formatTemplate(t("ingestionNew.pipelineSuggested"), {
                            preset: suggestedPresetLabel,
                        })}</span
                    >
                </div>
                <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {#each presets as preset (preset.id)}
                        <ChoiceCard
                            title={preset.label}
                            sub={preset.sub}
                            selected={selectedPreset === preset.id}
                            disabled={!allowedPresets.has(preset.id)}
                            onclick={() => {
                                selectedPreset = preset.id;
                            }}
                        />
                    {/each}
                </div>
            </div>

            <!-- Visibility -->
            <div class="flex flex-col gap-3">
                <span
                    class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium"
                    >{t("intent.visibility")}</span
                >
                <div class="grid grid-cols-3 gap-3 max-w-md">
                    {#each visibilityOptions as vis (vis.id)}
                        <ChoiceCard
                            title={vis.label}
                            sub={vis.sub}
                            selected={selectedVisibility === vis.id}
                            onclick={() => {
                                selectedVisibility = vis.id;
                            }}
                            compact
                        />
                    {/each}
                </div>
            </div>

            <!-- Provenance / notes -->
            <div class="flex flex-col gap-2">
                <label
                    for="summary"
                    class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium"
                    >{t("ingestionNew.sections.provenance")}</label
                >
                <textarea
                    id="summary"
                    name="summary"
                    rows="4"
                    class="w-full border border-border-soft bg-surface-white px-4 py-[10px] text-sm text-text-ink rounded-2xl resize-vertical focus:outline-none focus:border-blue-slate focus:ring-2 focus:ring-blue-slate/25 transition-all leading-relaxed"
                    placeholder={t("ingestionNew.fields.provenancePlaceholder")}
                    bind:value={notes}
                ></textarea>
            </div>

            <!-- Tags -->
            <div class="flex flex-col gap-2">
                <label
                    for="tagsInput"
                    class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium"
                    >{t("intent.tags")}</label
                >
                <div class="flex items-center gap-2">
                    <input
                        id="tagsInput"
                        type="text"
                        class="flex-1 border border-border-soft bg-surface-white px-4 py-[10px] text-sm text-text-ink rounded-2xl focus:outline-none focus:border-blue-slate focus:ring-2 focus:ring-blue-slate/25 transition-all"
                        placeholder={t("ingestionNew.fields.tagsPlaceholder")}
                        bind:value={tagsInput}
                        onkeydown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addTag();
                            }
                        }}
                    />
                    <button
                        type="button"
                        class="flex-shrink-0 rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:bg-pale-sky/20 hover:text-text-ink transition-all"
                        onclick={addTag}>{t("ingestionNew.summary.add")}</button
                    >
                </div>
                {#if summaryTags.length > 0}
                    <div class="flex flex-wrap gap-2 mt-1">
                        {#each summaryTags as tag (tag)}
                            <button
                                type="button"
								aria-label={formatTemplate(t("ingestionNew.removeTag"), { tag })}
                                onclick={() => removeTag(tag)}
                                class="inline-flex items-center gap-1 rounded-full border border-border-soft bg-pale-sky/20 px-3 py-1 text-xs text-blue-slate hover:bg-pale-sky/40 transition-all"
                            >
                                {tag}
                                <Icon name="x" size={10} />
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            {#if errorMessage}
                <p
                    class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-4 py-3 text-xs text-burnt-peach"
                >
                    {errorMessage}
                </p>
            {/if}
        </div>
    </form>

    <!-- Sticky footnote bar -->
    <FootnoteBar>
        {#snippet left()}
            <span
                class="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-text-muted"
                >{formatTemplate(t("ingestionNew.stepCounter"), { current: 1, total: 3 })}</span
            >
            <span class="hidden sm:flex"
                ><Stepper steps={STEPS} current={0} /></span
            >
        {/snippet}
        {#snippet right()}
            <a
                href={resolve("/ingestion")}
                class="inline-flex items-center gap-2 rounded-full border border-border-soft px-5 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:bg-pale-sky/20 hover:text-text-ink transition-all"
            >
                {t("common.cancel")}
            </a>
            <button
                type="submit"
                form="new-batch-form"
                disabled={submitting}
                class="inline-flex items-center gap-2 rounded-full bg-blue-slate text-surface-white px-5 py-2 text-xs uppercase tracking-[0.2em] border border-blue-slate hover:bg-blue-slate-mid-dark transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
                {submitting ? t("ingestionNew.creating") : t("ingestionNew.continueShort")}
                <Icon name="arrow-r" size={13} />
            </button>
        {/snippet}
    </FootnoteBar>
</div>

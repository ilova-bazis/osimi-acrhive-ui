// App entry — orchestrates routing between the 3 screens + tweaks panel
const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "scholarly",
  "density": "comfortable",
  "aiMarking": "subtle",
  "pipelineViz": "flow"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply data attributes to root for tokens.css to pick up
  useEffectApp(() => {
    document.documentElement.setAttribute('data-direction', tweaks.direction);
    document.documentElement.setAttribute('data-density', tweaks.density);
    document.documentElement.setAttribute('data-ai-marking', tweaks.aiMarking);
  }, [tweaks.direction, tweaks.density, tweaks.aiMarking]);

  const [screen, setScreen] = useStateApp('create'); // create | setup | review
  const [form, setForm] = useStateApp({
    name: 'NoorMags Issue 80–82',
    kind: 'newspaper',
    lang: 'fa',
    preset: 'ocr',
    visibility: 'team',
  });
  const [files, setFiles] = useStateApp(window.OSIMI.FILES);

  const batch = (screen === 'setup' || screen === 'review') ? { id: 'b-2407', name: form.name } : null;

  return (
    <>
      <AppShell currentScreen={screen} batch={batch}>
        {screen === 'create' && (
          <ScreenCreate form={form} setForm={setForm} onSubmit={() => setScreen('setup')} />
        )}
        {screen === 'setup' && (
          <ScreenSetup
            form={form} files={files} setFiles={setFiles}
            pipelineVizStyle={tweaks.pipelineViz}
            onBack={() => setScreen('create')}
            onContinue={() => setScreen('review')}
          />
        )}
        {screen === 'review' && (
          <ScreenReview
            form={form} files={files}
            pipelineVizStyle={tweaks.pipelineViz}
            onBack={(i) => setScreen(i === 0 ? 'create' : 'setup')}
            onConfirm={() => alert('In a real build, this would submit and navigate to the batch detail / status view.')}
          />
        )}
      </AppShell>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Visual direction">
          <TweakRadio
            value={tweaks.direction}
            onChange={(v) => setTweak('direction', v)}
            options={[
              { value: 'scholarly', label: 'Scholarly' },
              { value: 'modern', label: 'Modern' },
              { value: 'editorial', label: 'Editorial' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Density">
          <TweakRadio
            value={tweaks.density}
            onChange={(v) => setTweak('density', v)}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}
          />
        </TweakSection>
        <TweakSection title="AI-marking">
          <TweakRadio
            value={tweaks.aiMarking}
            onChange={(v) => setTweak('aiMarking', v)}
            options={[
              { value: 'subtle', label: 'Subtle tint' },
              { value: 'badge', label: 'Badges only' },
              { value: 'mono', label: 'Mono type' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Pipeline visualization (review)">
          <TweakRadio
            value={tweaks.pipelineViz}
            onChange={(v) => setTweak('pipelineViz', v)}
            options={[
              { value: 'flow', label: 'Flow diagram' },
              { value: 'rows', label: 'Stacked rows' },
              { value: 'chips', label: 'Inline chips' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Jump to step">
          <TweakRadio
            value={screen}
            onChange={setScreen}
            options={[
              { value: 'create', label: '01 Create' },
              { value: 'setup', label: '02 Setup' },
              { value: 'review', label: '03 Review' },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

import { useState } from "react";
import type { ReactNode } from "react";
import { Badge } from "./badge";
import { BusyLamp } from "./busy-lamp";
import { Button } from "./button";
import { Callout } from "./callout";
import { Card } from "./card";
import { Display } from "./display";
import { Input } from "./input";
import { Key } from "./key";
import { Keypad } from "./keypad";
import { Toggle } from "./toggle";
import type { BadgeTone } from "./badge";
import type { LampState } from "./busy-lamp";
import type { ButtonSize, ButtonVariant } from "./button";
import type { CalloutTone } from "./callout";
import type { DisplayState } from "./display";
import type { KeyFace } from "./key";

const BUTTON_VARIANTS: ButtonVariant[] = ["primary", "secondary", "danger", "accent", "ghost"];
const BUTTON_SIZES: ButtonSize[] = ["sm", "md", "lg"];
const BADGE_TONES: BadgeTone[] = ["neutral", "info", "success", "warning", "danger"];
const KEY_FACES: KeyFace[] = ["number", "operator", "function", "equals", "clear"];
const DISPLAY_STATES: DisplayState[] = ["idle", "busy", "error"];
const CALLOUT_TONES: CalloutTone[] = ["danger", "warning", "success", "info"];
const LAMP_STATES: LampState[] = ["idle", "busy", "up", "down"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ds-section">
      <h2 className="ds-subhead">{title}</h2>
      {children}
    </section>
  );
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ds-specimen">
      <span className="ds-specimen__label">{label}</span>
      {children}
    </div>
  );
}

/** Living gallery: one specimen of every @repo/ui component, in every variant. */
export function DesignSystemGallery() {
  const [toggleOn, setToggleOn] = useState(true);
  const [activeKey, setActiveKey] = useState<KeyFace | null>("operator");
  const [dismissed, setDismissed] = useState(false);

  return (
    <main className="ds-page">
      <header className="ds-masthead">
        <h1 className="ds-masthead__title">Design System Gallery</h1>
        <Badge tone="info">@repo/ui</Badge>
        <BusyLamp state="up" label="Live" />
      </header>

      <Section title="Button">
        <div className="ds-grid">
          {BUTTON_VARIANTS.map((variant) => (
            <Specimen key={variant} label={variant}>
              <div className="ds-row">
                {BUTTON_SIZES.map((size) => (
                  <Button key={size} variant={variant} size={size}>
                    {size.toUpperCase()}
                  </Button>
                ))}
                <Button variant={variant} disabled>
                  Disabled
                </Button>
              </div>
            </Specimen>
          ))}
          <Specimen label="block">
            <Button variant="primary" block>
              Full width
            </Button>
          </Specimen>
        </div>
      </Section>

      <Section title="Card">
        <div className="ds-grid">
          <Card
            tone="paper"
            eyebrow="Paper"
            title="Card with head and foot"
            footer={
              <Button size="sm" variant="secondary">
                Footer action
              </Button>
            }
          >
            <p>The default surface: warm paper, hard black border, hard offset shadow.</p>
          </Card>
          <Card
            tone="sunken"
            eyebrow="Sunken"
            title="Recessed surface"
            footer={<Badge tone="neutral">Footer slot</Badge>}
          >
            <p>Use the sunken tone for panels nested inside another card.</p>
          </Card>
          <Card>
            <p>Body only — no eyebrow, title, or footer.</p>
          </Card>
        </div>
      </Section>

      <Section title="Badge">
        <div className="ds-row">
          {BADGE_TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Key">
        <div className="ds-grid">
          <Specimen label="faces">
            <div className="ds-row">
              {KEY_FACES.map((face) => (
                <Key key={face} face={face} label={face.charAt(0).toUpperCase()} ariaLabel={face} />
              ))}
            </div>
          </Specimen>
          <Specimen label="sublabel · active · disabled">
            <div className="ds-row">
              <Key face="function" label="√" sublabel="sqrt" ariaLabel="Square root" />
              <Key face="operator" label="×" ariaLabel="Multiply" active />
              <Key face="number" label="7" disabled />
            </div>
          </Specimen>
        </div>
      </Section>

      <Section title="Keypad">
        <div className="ds-grid">
          <Specimen label="four columns · span">
            <Keypad>
              <Key face="clear" label="AC" span={2} onPress={() => setActiveKey(null)} />
              <Key face="function" label="%" ariaLabel="Percentage" />
              <Key
                face="operator"
                label="÷"
                ariaLabel="Divide"
                active={activeKey === "function"}
                onPress={() => setActiveKey("function")}
              />
              <Key face="number" label="7" />
              <Key face="number" label="8" />
              <Key face="number" label="9" />
              <Key
                face="operator"
                label="×"
                ariaLabel="Multiply"
                active={activeKey === "operator"}
                onPress={() => setActiveKey("operator")}
              />
              <Key face="number" label="0" span={2} />
              <Key face="number" label="." ariaLabel="Decimal point" />
              <Key face="equals" label="=" ariaLabel="Equals" />
            </Keypad>
          </Specimen>
        </div>
      </Section>

      <Section title="Display">
        <div className="ds-grid">
          {DISPLAY_STATES.map((state) => (
            <Specimen key={state} label={`state · ${state}`}>
              <Display
                state={state}
                value={state === "error" ? "ERR" : "1 234.56"}
                expression="12 × 102.88"
                hint={state === "error" ? "Cannot divide by zero" : "Result rounded to 2 dp"}
              />
            </Specimen>
          ))}
          <Specimen label="size · sm">
            <Display size="sm" value="42" expression="6 × 7" />
          </Specimen>
          <Specimen label="size · md (default)">
            <Display value="42" expression="6 × 7" />
          </Specimen>
          <Specimen label="size · lg">
            <Display size="lg" value="42" expression="6 × 7" />
          </Specimen>
          <Specimen label="defaults only">
            <Display />
          </Specimen>
        </div>
      </Section>

      <Section title="Callout">
        <div className="ds-stack">
          {CALLOUT_TONES.map((tone) => (
            <Callout key={tone} tone={tone} title={`${tone} callout`} code={tone.toUpperCase()}>
              A short explanation of what happened and what to do next.
            </Callout>
          ))}
          <Callout tone="info" title="Title only" />
          {!dismissed && (
            <Callout
              tone="warning"
              title="Dismissible"
              code="RESULT_NOT_FINITE"
              onDismiss={() => setDismissed(true)}
            >
              Press the × to remove this callout.
            </Callout>
          )}
          {dismissed && (
            <Button size="sm" variant="ghost" onClick={() => setDismissed(false)}>
              Restore dismissible callout
            </Button>
          )}
        </div>
      </Section>

      <Section title="BusyLamp">
        <div className="ds-row">
          {LAMP_STATES.map((state) => (
            <BusyLamp key={state} state={state} label={state} />
          ))}
          <BusyLamp state="busy" />
        </div>
      </Section>

      <Section title="Input">
        <div className="ds-field-grid">
          <Input label="Operand" placeholder="0" defaultValue="12" />
          <Input label="With hint" hint="Decimals allowed" defaultValue="3.14" />
          <Input label="With suffix" suffix="ms" defaultValue="3000" inputMode="numeric" />
          <Input label="Invalid" invalid hint="Enter a finite number" defaultValue="abc" />
          <Input label="Disabled" defaultValue="0" disabled />
          <Input label="Read only" defaultValue="42" readOnly />
          <Input placeholder="No label" />
        </div>
      </Section>

      <Section title="Toggle">
        <div className="ds-row ds-row--top">
          <Toggle checked={toggleOn} onChange={setToggleOn} label={toggleOn ? "On" : "Off"} />
          <Toggle checked={false} label="Off (static)" />
          <Toggle checked disabled label="Disabled on" />
          <Toggle disabled label="Disabled off" />
          <Toggle checked={toggleOn} onChange={setToggleOn} />
        </div>
      </Section>
    </main>
  );
}

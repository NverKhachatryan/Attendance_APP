/* eslint-disable import/no-extraneous-dependencies */
import { Select } from 'flowbite-react';

export type NarrativeType =
  | 'Friendly'
  | 'Relaxed'
  | 'Professional'
  | 'Witty'
  | 'Luxury';

interface DropDownProps {
  narrative: NarrativeType;
  setNarrative: (narrative: NarrativeType) => void;
}

const vibes: NarrativeType[] = [
  'Friendly',
  'Relaxed',
  'Professional',
  'Witty',
  'Luxury'
];

export default function DropDownTargetNarrative({
  narrative,
  setNarrative,
}: DropDownProps) {
  return (
    <>
      <div id="select">
        <Select
          id="media"
          name="media"
          value={narrative}
          onChange={(event) =>
            setNarrative(event.target.value as NarrativeType)
          }
        >
          {vibes.map((vibeItem) => (
            <option key={vibeItem}>{vibeItem}</option>
          ))}
        </Select>
      </div>
    </>
  );
}

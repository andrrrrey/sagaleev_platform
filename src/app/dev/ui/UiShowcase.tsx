'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Kicker } from '@/components/ui/Kicker';
import { Panel } from '@/components/ui/Panel';
import { StatusPill } from '@/components/ui/StatusPill';
import { LinedBlock } from '@/components/ui/LinedBlock';
import { Tag } from '@/components/ui/Tag';
import { Tabs } from '@/components/ui/Tabs';
import { Table, THead, Th, TRow, Td } from '@/components/ui/Table';
import { ProgressBar, SegmentedProgress } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { CopyButton } from '@/components/ui/CopyButton';
import { LockedPanel } from '@/components/ui/LockedPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { Label, Input, Textarea, Select, Checkbox, FieldError } from '@/components/ui/Field';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[#e0dcd0]/60 pt-8">
      <Kicker className="mb-6">{title}</Kicker>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

export function UiShowcase() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-10">
      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary">
            <Icon name="power-linear" /> Primary
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">
            Ghost <Icon name="arrow-right-linear" />
          </Button>
          <Button variant="action">
            <Icon name="play-circle-linear" className="text-sm text-[#d95321] group-hover:scale-110" />
            Отправить агенту
          </Button>
          <Button variant="icon" aria-label="icon">
            <Icon name="paperclip-linear" className="text-lg" />
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Status pills">
        <div className="flex flex-wrap items-center gap-4">
          <StatusPill pulse>Live</StatusPill>
          <StatusPill>Внедрён</StatusPill>
          <StatusPill muted>Не начат</StatusPill>
          <StatusPill
            trailing={
              <>
                <Icon name="programming-linear" className="text-zinc-700" />
                <Icon name="database-linear" className="text-zinc-400" />
              </>
            }
          >
            Data streams
          </StatusPill>
        </div>
      </Section>

      <Section title="Panels + Lined block">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel
            title="Session // Active"
            status={<StatusPill pulse>Готов</StatusPill>}
            footer={
              <>
                <Button variant="icon" aria-label="attach">
                  <Icon name="paperclip-linear" className="text-lg" />
                </Button>
                <CopyButton text="Execute sequence" label="Скопировать" />
              </>
            }
          >
            <LinedBlock label="Prompt">
              <p>Собери контент-план на неделю по нише клиента.</p>
              <p>Учитывай голос бренда из бизнес-профиля.</p>
            </LinedBlock>
          </Panel>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Tag>SEO</Tag>
              <Tag>Директ</Tag>
              <Tag active>2ГИС</Tag>
            </div>
            <ProgressBar value={62} />
            <SegmentedProgress total={5} filled={3} />
            <LockedPanel requiredPlan="SUPPORT" />
          </div>
        </div>
      </Section>

      <Section title="Forms">
        <div className="grid max-w-xl grid-cols-1 gap-5">
          <div>
            <Label htmlFor="d-input">Email</Label>
            <Input id="d-input" placeholder="you@example.ru" />
          </div>
          <div>
            <Label htmlFor="d-mono">Kinescope ID</Label>
            <Input id="d-mono" mono placeholder="a1b2c3" />
          </div>
          <div>
            <Label htmlFor="d-ta">Промпт</Label>
            <Textarea id="d-ta" mono rows={3} />
          </div>
          <div>
            <Label htmlFor="d-sel">Группа</Label>
            <Select id="d-sel">
              <option>Стратегия</option>
              <option>Трафик</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="d-err">С ошибкой</Label>
            <Input id="d-err" invalid />
            <FieldError>Обязательное поле</FieldError>
          </div>
          <Checkbox id="d-cb" label="Согласие на обработку ПДн" defaultChecked />
        </div>
      </Section>

      <Section title="Tabs + Table">
        <Tabs
          items={[
            {
              key: 'overview',
              label: 'Обзор',
              content: (
                <Table>
                  <THead>
                    <tr>
                      <Th>Место</Th>
                      <Th>Имя</Th>
                      <Th>Очки</Th>
                    </tr>
                  </THead>
                  <tbody>
                    <TRow>
                      <Td mono>01</Td>
                      <Td>Анна</Td>
                      <Td mono>128</Td>
                    </TRow>
                    <TRow>
                      <Td mono>02</Td>
                      <Td>Борис</Td>
                      <Td mono>96</Td>
                    </TRow>
                  </tbody>
                </Table>
              ),
            },
            { key: 'article', label: 'Статья', content: <p className="text-sm font-light">Контент статьи…</p> },
            { key: 'transcript', label: 'Транскрипт', content: <LinedBlock>Полный транскрипт…</LinedBlock> },
          ]}
        />
      </Section>

      <Section title="Modal + Empty + Toast">
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setModalOpen(true)}>Открыть модалку</Button>
          <CopyButton text="Проверка тоста" label="Тост" />
        </div>
        <EmptyState label="Empty // State">Ничего не найдено. Сбросьте фильтры.</EmptyState>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Money"
          footer={<Button onClick={() => setModalOpen(false)}>Сохранить</Button>}
        >
          <div className="flex flex-col gap-4">
            <Label htmlFor="m-amount">Сумма, ₽</Label>
            <Input id="m-amount" mono />
          </div>
        </Modal>
      </Section>
    </div>
  );
}

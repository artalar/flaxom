import { reatomComponent, useAtom, useAction } from '@reatom/npm-react'
import { Box, Button, Flex, Label, Stack, TextInput, VFlex } from '~/basic'
import { cx, uuid } from '~/utils'
import { atom, type AtomMut } from '@reatom/framework'

const padder = <Label className="invisible">Surname: </Label>

const createItemAtom = (name: string): [string, AtomMut<string>] => {
  const id = uuid()
  return [id, atom(name, `item#${id}.name`)]
}

export const Crud = reatomComponent(({ ctx }) => {
  const [prefix, setPrefix, prefixAtom] = useAtom('')
  const [firstName, setFirstName, firstNameAtom] = useAtom('')
  const [lastName, setLastName, lastNameAtom] = useAtom('')
  const [, , nameAtom] = useAtom(
    (ctx) => `${ctx.spy(lastNameAtom)}, ${ctx.spy(firstNameAtom)}`,
  )
  const [selected, setSelected, selectedAtom] = useAtom('')
  const [, , dbAtom] = useAtom([
    createItemAtom('Emil, Hans'),
    createItemAtom('Mustermann, Max'),
    createItemAtom('Tisch, Roman'),
  ])
  const [filtered] = useAtom(
    (ctx) => {
      const prefix = ctx.spy(prefixAtom)

      return ctx
        .spy(dbAtom)
        .filter(([, x]) =>
          ctx.get(x).toLowerCase().includes(prefix.toLowerCase()),
        )
    },
    [prefixAtom, dbAtom],
  )

  const handleCreate = useAction(
    (ctx) => {
      const next = ctx.get(nameAtom)
      return dbAtom(ctx, (prev) => prev.concat([createItemAtom(next)]))
    },
    [dbAtom, nameAtom],
  )

  const handleUpdate = useAction(
    (ctx) => {
      const selectedId = ctx.get(selectedAtom)

      ctx
        .get(dbAtom)
        .find(([id]) => id === selectedId)?.[1](ctx, ctx.get(nameAtom))
    },
    [selectedAtom, dbAtom, nameAtom],
  )

  const handleDelete = useAction(
    (ctx) => {
      const id = ctx.get(selectedAtom)
      const index = ctx.get(dbAtom).findIndex(([i]) => i === id)
      if (index === -1) return
      dbAtom(ctx, (prev) => prev.filter((_, i) => i !== index))
    },
    [selectedAtom, dbAtom],
  )

  return (
    <VFlex className={cx('min-w-[410px]')} vspace="8px">
      <Flex hspace="4px">
        <Flex className={cx('flex-1')}>
          <Label>
            Filter{'\u00A0'}prefix:{'\u00A0'}
          </Label>
          <TextInput
            className={cx('w-0', 'flex-1')}
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
        </Flex>
        <div className={cx('flex-1')} />
      </Flex>

      <Flex hspace="4px">
        <select
          size={2}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className={cx(
            'flex-1',
            'border-solid',
            'border-[1px]',
            'border-[#ddd]',
            'rounded-[5px]',
          )}
        >
          {filtered.map(([id, x]) => (
            <option key={id} value={id}>
              {ctx.spy(x)}
            </option>
          ))}
        </select>
        <Box className="flex-1" vspace="4px">
          <Flex>
            <Stack>
              {padder}
              <Label>Name: </Label>
            </Stack>
            <TextInput
              className={cx('flex-1')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Flex>
          <Flex>
            <Label>Surname: </Label>
            <TextInput
              className={cx('flex-1')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Flex>
        </Box>
      </Flex>

      <Flex hspace="4px">
        <Button onClick={handleCreate}>Create</Button>
        <Button onClick={handleUpdate}>Update</Button>
        <Button onClick={handleDelete}>Delete</Button>
      </Flex>
    </VFlex>
  )
}, 'Crud')

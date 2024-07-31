import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { zodRows } from './data'
import { reatomComponent } from '@reatom/npm-react'
import { reatomZod } from '@reatom/npm-zod'
import { DataList } from './types'

const zodRows = reatomZod(DataList, { initState: dataRows })

export const TableWithZodAtomization = reatomComponent(
  ({ ctx }) => (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Dessert (100g serving)</TableCell>
            <TableCell align="right">Calories</TableCell>
            <TableCell align="right">Fat&nbsp;(g)</TableCell>
            <TableCell align="right">Carbs&nbsp;(g)</TableCell>
            <TableCell align="right">Protein&nbsp;(g)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ctx.spy(zodRows.array).map((row, i) => (
            <TableRow
              key={i}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell align="right">
                <row.calories.TextField label="calories" variant="standard" />
              </TableCell>
              <TableCell align="right">
                <row.fat.TextField label="fat" variant="standard" />
              </TableCell>
              <TableCell align="right">
                <row.carbs.TextField label="carbs" variant="standard" />
              </TableCell>
              <TableCell align="right">
                <row.protein.TextField label="protein" variant="standard" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ),
  'TableWithZodAtomization',
)

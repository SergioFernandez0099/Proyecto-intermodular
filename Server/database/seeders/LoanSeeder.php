<?php

namespace Database\Seeders;

use App\Models\Copy;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Database\Seeder;

class LoanSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('role', 'user')->get();
        $copies = Copy::where('state', 'available')->get();

        foreach ($users as $user) {
            // Cada usuario tiene entre 1 y 3 préstamos
            $copiesToLoan = $copies->random(rand(1, 3));

            foreach ($copiesToLoan as $copy) {
                $loanDate = fake()->dateTimeBetween('-6 months', '-1 week');
                $isReturned = fake()->boolean(60); // 60% devueltos

                Loan::create([
                    'user_id' => $user->id,
                    'copy_id' => $copy->id,
                    'loan_date' => $loanDate,
                    'return_date' => $isReturned
                        ? fake()->dateTimeBetween($loanDate, 'now')
                        : null,
                ]);

                // Si no está devuelto, marca la copia como borrowed
                if (!$isReturned) {
                    $copy->update(['state' => 'borrowed']);
                }

                // Elimina la copia del pool para no asignarla dos veces
                $copies = $copies->except($copy->id);
            }
        }
    }
}

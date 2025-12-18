/**
 * MODELO PARA TOKENS DE RESET PASSWORD
 * Agregar esto al schema.prisma
 */

/*
model PasswordResetToken {
  id          String    @id @default(uuid())
  token       String    @unique
  userId      String    @map("user_id")
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt   DateTime  @map("expires_at")
  usedAt      DateTime? @map("used_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  @@index([userId])
  @@index([token])
  @@map("password_reset_tokens")
}

// Agregar esta relación en el modelo User:
// passwordResetTokens  PasswordResetToken[]
*/

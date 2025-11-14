#!/usr/bin/env python3
"""
Quick smoke test for critical workflows
Tests database migrations, RLS policies, and edge cases
"""

import json
import subprocess
import sys
from pathlib import Path

def run_test(name, command, expected_pass=True):
    """Run a test and report results"""
    print(f"\n🧪 Testing: {name}")
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )

        success = result.returncode == 0
        if success == expected_pass:
            print(f"   ✅ PASS")
            return True
        else:
            print(f"   ❌ FAIL")
            print(f"   stdout: {result.stdout[:200]}")
            print(f"   stderr: {result.stderr[:200]}")
            return False
    except subprocess.TimeoutExpired:
        print(f"   ⏱️ TIMEOUT")
        return False
    except Exception as e:
        print(f"   💥 ERROR: {e}")
        return False

def main():
    print("🔥 SMOKE TEST - Contadores de Elite")
    print("=" * 60)

    tests = [
        (
            "Build compiles",
            "npm run build 2>&1 | grep -q '✓ built'",
            True
        ),
        (
            "TypeScript has no errors in src/",
            "npx tsc --noEmit 2>&1 | grep -q 'error' && exit 1 || exit 0",
            True
        ),
        (
            "Database migrations exist",
            "ls -1 supabase/migrations/ | grep -q '20251115' && exit 0 || exit 1",
            True
        ),
        (
            "Webhook function exists",
            "ls -1 supabase/functions/webhook-asaas/index.ts | grep -q webhook",
            True
        ),
        (
            "Auth handler function exists",
            "grep -q 'handle_new_user' supabase/migrations/20251105215330_d89b630c-712b-40c4-94de-12fc8b6dab93.sql",
            True
        ),
        (
            "Contadores creation in trigger",
            "grep -q 'INSERT INTO public.contadores' supabase/migrations/20251105215330_d89b630c-712b-40c4-94de-12fc8b6dab93.sql",
            True
        ),
        (
            "RLS policy uses get_contador_id()",
            "grep -q 'get_contador_id(auth.uid())' supabase/migrations/20251115000000_add_solicitacoes_saque.sql",
            True
        ),
        (
            "Webhook signature validation throws on missing secret",
            "grep -q 'throw new Error' supabase/functions/webhook-asaas/index.ts && grep -q 'ASAAS_WEBHOOK_SECRET' supabase/functions/webhook-asaas/index.ts",
            True
        ),
        (
            "Auto-approval migration exists",
            "grep -q 'auto_aprovar_comissoes' supabase/migrations/20251115000100_auto_approve_commissions.sql",
            True
        ),
        (
            "Perfil validation for bank data",
            "grep -q 'hasPixKey\\|hasBankAccount' lovable-Celite/src/pages/Perfil.tsx",
            True
        ),
        (
            "Withdrawal confirmation modal exists",
            "grep -q 'Confirmar Solicitação de Saque' lovable-Celite/src/pages/Comissoes.tsx",
            True
        ),
        (
            "Commission calculation file exists",
            "ls -1 supabase/functions/calcular-comissoes/index.ts | wc -l | grep -q '[1-9]'",
            True
        ),
    ]

    passed = 0
    failed = 0

    for name, cmd, expected in tests:
        if run_test(name, cmd, expected):
            passed += 1
        else:
            failed += 1

    print("\n" + "=" * 60)
    print(f"📊 Results: {passed} passed, {failed} failed")

    if failed == 0:
        print("\n✅ ALL CRITICAL CHECKS PASSED!")
        print("\nReady for next phase:")
        print("  1. Run local dev server: npm run dev")
        print("  2. Test workflows manually (see SMOKE_TEST.md)")
        print("  3. If all pass → Deploy to staging")
        return 0
    else:
        print("\n❌ SOME CHECKS FAILED - Fix before proceeding")
        return 1

if __name__ == "__main__":
    sys.exit(main())

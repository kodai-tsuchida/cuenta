"use client";

import { useActionState } from "react";

import {
  createInvoiceDraft,
  createLoan,
  createTimeEntry,
  createTransaction,
  type FormState,
} from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { SubmitButton } from "@/components/forms/submit-button";
import { cn } from "@/lib/utils";

const formInitialState: FormState = {
  status: "idle",
  message: "",
};

function FieldHint({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message: string;
}) {
  if (!message) {
    return (
      <p className="text-xs text-slate-500">
        Supabase 設定後は送信内容がそのまま保存されます。
      </p>
    );
  }

  return (
    <p
      className={cn(
        "text-xs",
        status === "error" ? "text-red-600" : "text-emerald-600",
      )}
    >
      {message}
    </p>
  );
}

function Textarea(props: React.ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        props.className,
      )}
    />
  );
}

function SelectField(props: React.ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cn(
        "flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        props.className,
      )}
    />
  );
}

export function CuentaForms() {
  const [transactionState, transactionAction] = useActionState(
    createTransaction,
    formInitialState,
  );
  const [loanState, loanAction] = useActionState(createLoan, formInitialState);
  const [timeState, timeAction] = useActionState(
    createTimeEntry,
    formInitialState,
  );
  const [invoiceState, invoiceAction] = useActionState(
    createInvoiceDraft,
    formInitialState,
  );

  return (
    <Tabs defaultValue="transaction" className="gap-5">
      <TabsList variant="line" className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="transaction">入出金を登録</TabsTrigger>
        <TabsTrigger value="loan">貸借を登録</TabsTrigger>
        <TabsTrigger value="time">勤怠を登録</TabsTrigger>
        <TabsTrigger value="invoice">請求書を作成</TabsTrigger>
      </TabsList>

      <TabsContent value="transaction">
        <form action={transactionAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="transactionDate">日付</Label>
              <Input id="transactionDate" name="transactionDate" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">金額</Label>
              <Input id="amount" name="amount" type="number" min="1" required />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="title">内容</Label>
              <Input id="title" name="title" placeholder="例: Adobe Creative Cloud" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="counterparty">相手先</Label>
              <Input id="counterparty" name="counterparty" placeholder="例: Adobe" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">科目</Label>
              <Input id="category" name="category" placeholder="例: 通信費" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kind">種別</Label>
              <SelectField id="kind" name="kind" defaultValue="expense">
                <option value="expense">支出</option>
                <option value="income">入金</option>
              </SelectField>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="scope">用途</Label>
              <SelectField id="scope" name="scope" defaultValue="business">
                <option value="business">事業用</option>
                <option value="personal">個人用</option>
              </SelectField>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="note">メモ</Label>
              <Textarea id="note" name="note" placeholder="補足があれば入力" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <FieldHint {...transactionState} />
            <SubmitButton>入出金を保存</SubmitButton>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="loan">
        <form action={loanAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="person">相手</Label>
              <Input id="person" name="person" placeholder="例: Kenta" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loanAmount">金額</Label>
              <Input id="loanAmount" name="amount" type="number" min="1" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="direction">方向</Label>
              <SelectField id="direction" name="direction" defaultValue="lent">
                <option value="lent">貸している</option>
                <option value="borrowed">借りている</option>
              </SelectField>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">期限</Label>
              <Input id="dueDate" name="dueDate" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">ステータス</Label>
              <SelectField id="status" name="status" defaultValue="open">
                <option value="open">未回収 / 未精算</option>
                <option value="settled">精算済</option>
              </SelectField>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="memo">メモ</Label>
              <Textarea id="memo" name="memo" placeholder="例: 旅行の立替分" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <FieldHint {...loanState} />
            <SubmitButton>貸借を保存</SubmitButton>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="time">
        <form action={timeAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="entryDate">日付</Label>
              <Input id="entryDate" name="entryDate" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="clientName">クライアント</Label>
              <Input id="clientName" name="clientName" placeholder="例: Moonlit Studio" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startTime">開始時間</Label>
              <Input id="startTime" name="startTime" type="time" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">終了時間</Label>
              <Input id="endTime" name="endTime" type="time" required />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="work">作業内容</Label>
              <Textarea id="work" name="work" placeholder="例: バナー修正、打ち合わせ、資料作成" required />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <FieldHint {...timeState} />
            <SubmitButton>勤怠を保存</SubmitButton>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="invoice">
        <form action={invoiceAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="clientNameInvoice">請求先名</Label>
              <Input
                id="clientNameInvoice"
                name="clientName"
                placeholder="例: Moonlit Studio合同会社"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">件名</Label>
              <Input id="subject" name="subject" placeholder="例: Web制作業務委託費" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="issuedOn">発行日</Label>
              <Input id="issuedOn" name="issuedOn" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueOn">支払期限</Label>
              <Input id="dueOn" name="dueOn" type="date" required />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="clientAddress">請求先住所</Label>
              <Textarea id="clientAddress" name="clientAddress" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sellerName">発行者名</Label>
              <Input id="sellerName" name="sellerName" placeholder="あなたの名前" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sellerEmail">発行者メール</Label>
              <Input id="sellerEmail" name="sellerEmail" type="email" required />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="lineLabel">明細</Label>
              <Input id="lineLabel" name="lineLabel" placeholder="例: LPデザイン・実装" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">数量</Label>
              <Input id="quantity" name="quantity" type="number" min="1" step="1" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitPrice">単価</Label>
              <Input id="unitPrice" name="unitPrice" type="number" min="1" step="1" required />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea id="notes" name="notes" placeholder="振込先や注意事項を入力" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <FieldHint {...invoiceState} />
            <SubmitButton>請求書を保存</SubmitButton>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}

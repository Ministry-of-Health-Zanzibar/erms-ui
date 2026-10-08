import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { ConversationService } from '../../../services/conversation.service';
import { FilterSelectComponent } from '@shared/ui';
import {
  ConversationMessage,
  ConversationRecord,
  ConversationTab,
} from '../conversation.types';

@Component({
  selector: 'app-conversation-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    FilterSelectComponent,
  ],
  templateUrl: './conversation-modal.component.html',
  styleUrl: './conversation-modal.component.scss',
})
export class ConversationModalComponent implements OnInit {
  conversationTabs: ConversationTab[] = [];
  activeConversationKey: string | null = null;
  activeReplyId: number | null = null;
  replyingTo: ConversationMessage | null = null;
  isNewConsultation = false;
  composerMessage = '';
  receiver = '';
  role = '';
  currentUserId: string | null = null;
  loadingMessages = true;
  sendingMessage = false;
  sendingReply = false;

  private selectNewestTabAfterLoad = false;

  patientInfo: any = {
    patient_name: 'Loading Context...',
    file_number: '...',
    diagnosis: '...',
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private conversationService: ConversationService,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.role = localStorage.getItem('roles') || '';
    this.currentUserId = localStorage.getItem('user_id');
    this.loadMessages();
  }

  get activeConversation(): ConversationTab | null {
    return this.conversationTabs.find(
      (tab) => tab.key === this.activeConversationKey,
    ) || null;
  }

  get activeMessages(): ConversationMessage[] {
    return this.activeConversation?.messages || [];
  }

  get activeMessageCount(): number {
    return this.activeMessages.length;
  }

  get receiverOptions(): { label: string; value: string }[] {
    const labels: Record<string, string> = {
      mkurugenzi: 'Medical Director',
      board: 'Medical Board',
      hospital: 'Hospital Team',
      dg: 'Director General',
    };

    return this.getReceivers().map((receiver) => ({
      label: labels[receiver] || receiver,
      value: receiver,
    }));
  }

  get composerLabel(): string {
    if (this.isNewConsultation) {
      return 'New consultation message';
    }

    return 'Reply message';
  }

  get composerPlaceholder(): string {
    if (this.isNewConsultation) {
      return 'Write a secure consultation message';
    }

    return this.activeReplyId !== null
      ? 'Write your reply to the selected message'
      : 'Write a message in this conversation';
  }

  get isComposerDisabled(): boolean {
    return !this.isNewConsultation && this.getReplyTargetId() === null;
  }

  isDG(): boolean {
    return this.role === 'ROLE DIRECTOR GENERAL';
  }

  isMkurugenzi(): boolean {
    return this.role === 'ROLE MKURUGENZI TIBA';
  }

  isBoard(): boolean {
    return this.role === 'ROLE MEDICAL BOARD MEMBER';
  }

  isHospital(): boolean {
    return this.role === 'ROLE HOSPITAL USER';
  }

  canStartConversation(): boolean {
    return !this.isHospital();
  }

  getReceivers(): string[] {
    if (this.isDG()) {
      return ['mkurugenzi', 'board', 'hospital'];
    }
    if (this.isMkurugenzi()) {
      return ['board', 'hospital'];
    }
    if (this.isBoard()) {
      return ['hospital'];
    }
    return [];
  }

  isCurrentUser(message: ConversationMessage): boolean {
    const senderId = message?.user_id ?? message?.sender_id;
    return this.sameUser(senderId, this.currentUserId);
  }

  openConversation(tab: ConversationTab): void {
    this.activeConversationKey = tab.key;
    this.resetComposer();
  }

  startNewConversation(): void {
    if (!this.canStartConversation()) {
      return;
    }

    this.isNewConsultation = true;
    this.activeReplyId = null;
    this.replyingTo = null;
    this.composerMessage = '';
    this.receiver = '';
  }

  cancelNewConversation(): void {
    this.resetComposer();
  }

  openReplyBox(message: ConversationMessage): void {
    this.isNewConsultation = false;
    this.activeReplyId = message.conversation_id;
    this.replyingTo = message;
    this.composerMessage = '';
  }

  cancelReply(): void {
    this.activeReplyId = null;
    this.replyingTo = null;
    this.composerMessage = '';
  }

  loadMessages(): void {
    this.loadingMessages = true;

    this.conversationService
      .getConversations(this.data.patientHistoryId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingMessages = false),
      )
      .subscribe({
        next: (response: any) => {
          const records = this.toRecords(response?.data);
          this.updateConversationState(records);
          this.markAsRead();
        },
        error: (error: any) => {
          if (this.isNoConversationError(error)) {
            this.conversationTabs = [];
            this.activeConversationKey = null;
            this.setEmptyPatientInfo();
            this.markAsRead();
            return;
          }

          console.error('Unable to load conversations:', error);
        },
      });
  }

  sendComposerMessage(): void {
    const message = this.composerMessage.trim();

    if (!message || this.isComposerDisabled) {
      return;
    }

    if (this.isNewConsultation) {
      this.sendNewConversation(message);
      return;
    }

    this.sendReply(message);
  }

  private sendNewConversation(message: string): void {
    if (!this.receiver || this.sendingMessage) {
      return;
    }

    this.sendingMessage = true;
    this.selectNewestTabAfterLoad = true;

    this.conversationService
      .sendMessage({
        patient_history_id: this.data.patientHistoryId,
        message,
        receiver: this.receiver,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.sendingMessage = false),
      )
      .subscribe({
        next: () => {
          this.composerMessage = '';
          this.receiver = '';
          this.isNewConsultation = false;
          this.loadMessages();
        },
        error: (error: any) => {
          this.selectNewestTabAfterLoad = false;
          console.error('Unable to send consultation:', error);
        },
      });
  }

  private sendReply(message: string): void {
    const parentId = this.getReplyTargetId();
    if (parentId === null || this.sendingReply) {
      return;
    }

    this.sendingReply = true;

    this.conversationService
      .sendMessage({
        patient_history_id: this.data.patientHistoryId,
        message,
        parent_id: parentId,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.sendingReply = false),
      )
      .subscribe({
        next: () => {
          this.cancelReply();
          this.loadMessages();
        },
        error: (error: any) => {
          console.error('Unable to send reply:', error);
        },
      });
  }

  private updateConversationState(records: ConversationRecord[]): void {
    this.updatePatientInfo(records[0]);

    const tabMap = new Map<string, ConversationTab>();

    records.forEach((record) => {
      const recipient = this.getRecipient(record);
      const tab = tabMap.get(recipient.key) || {
        key: recipient.key,
        recipientId: recipient.id,
        recipientName: recipient.name,
        messages: [],
      };

      tab.messages.push(
        this.normalizeMessage(record),
        ...(record.replies || []).map((reply) =>
          this.normalizeMessage(reply, record.conversation_id),
        ),
      );
      tabMap.set(recipient.key, tab);
    });

    const tabs = Array.from(tabMap.values()).map((tab) => ({
      ...tab,
      messages: tab.messages.sort(
        (first, second) => first.conversation_id - second.conversation_id,
      ),
    }));

    tabs.sort((first, second) => this.lastMessageId(second) - this.lastMessageId(first));
    this.conversationTabs = tabs;

    const currentKey = this.activeConversationKey;
    if (this.selectNewestTabAfterLoad) {
      this.activeConversationKey = tabs[0]?.key || null;
      this.selectNewestTabAfterLoad = false;
    } else if (currentKey && tabs.some((tab) => tab.key === currentKey)) {
      this.activeConversationKey = currentKey;
    } else {
      this.activeConversationKey = tabs[0]?.key || null;
    }
  }

  private getRecipient(record: ConversationRecord): {
    key: string;
    id: number | string | null;
    name: string;
  } {
    const senderId = record.user_id ?? record.sender_id ?? null;
    const receiverId = record.receiver_id ?? null;
    const currentUserIsSender = this.sameUser(senderId, this.currentUserId);
    const recipientId = currentUserIsSender ? receiverId : senderId;
    const recipientName = currentUserIsSender
      ? (record.receiver_full_name || 'Care team member')
      : (record.sender_full_name || 'Care team member');
    const recipientKey = recipientId !== null
      ? `user:${recipientId}`
      : `name:${recipientName.toLowerCase()}`;

    return {
      key: recipientKey,
      id: recipientId,
      name: recipientName,
    };
  }

  private normalizeMessage(message: ConversationMessage, parentId: number | null = null): ConversationMessage {
    return {
      ...message,
      conversation_id: Number(message.conversation_id),
      parent_id: message.parent_id ?? parentId,
    };
  }

  private lastMessageId(tab: ConversationTab): number {
    return tab.messages.reduce(
      (latest, message) => Math.max(latest, message.conversation_id),
      0,
    );
  }

  private toRecords(data: any): ConversationRecord[] {
    if (!data) {
      return [];
    }

    const records = Array.isArray(data) ? data : [data];
    return records as ConversationRecord[];
  }

  private updatePatientInfo(record?: ConversationRecord): void {
    if (!record) {
      this.setEmptyPatientInfo();
      return;
    }

    this.patientInfo = {
      patient_name: record.patient_name || 'Unknown Patient',
      file_number: record.file_number || 'N/A',
      diagnosis: record.diagnosis || 'General Consultation',
    };
  }

  private setEmptyPatientInfo(): void {
    this.patientInfo = {
      patient_name: 'New Consultation Thread',
      file_number: 'N/A',
      diagnosis: 'No prior diagnostic history found.',
    };
  }

  private markAsRead(): void {
    this.conversationService
      .markAsRead(this.data.patientHistoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: any) => console.error('Unable to mark conversations as read:', error),
      });
  }

  private resetComposer(): void {
    this.isNewConsultation = false;
    this.activeReplyId = null;
    this.replyingTo = null;
    this.composerMessage = '';
    this.receiver = '';
  }

  private getReplyTargetId(): number | null {
    if (this.activeReplyId !== null) {
      return this.activeReplyId;
    }

    return this.activeConversation?.messages.find((message) => !message.parent_id)?.conversation_id
      ?? this.activeMessages[0]?.conversation_id
      ?? null;
  }

  private isNoConversationError(error: any): boolean {
    return error?.status === 404 || error?.error?.statusCode === 404;
  }

  private sameUser(first: number | string | null | undefined, second: number | string | null | undefined): boolean {
    return first !== null
      && first !== undefined
      && second !== null
      && second !== undefined
      && String(first) === String(second);
  }
}

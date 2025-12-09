from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User, Conversation, Message


class Command(BaseCommand):
    help = 'Seed sample chat data for testing'

    def handle(self, *args, **options):
        # Get existing users
        users = User.objects.all()
        if users.count() < 2:
            self.stdout.write(
                self.style.WARNING('Need at least 2 users to create chat data. Run seed_test_users first.')
            )
            return

        # Create a conversation between first two users
        user1 = users[0]
        user2 = users[1]

        self.stdout.write(f'Creating conversation between {user1.email} and {user2.email}')

        # Check if conversation already exists
        conversation = Conversation.objects.filter(
            participants=user1
        ).filter(
            participants=user2
        ).filter(
            is_active=True
        ).first()

        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(user1, user2)
            self.stdout.write(self.style.SUCCESS(f'Created conversation {conversation.id}'))

        # Create some sample messages
        messages_data = [
            (user1, "Hi there! How are you doing?"),
            (user2, "Hello! I'm doing well, thank you. How about you?"),
            (user1, "I'm great! Just checking out the new chat system."),
            (user2, "It's really nice! The interface looks clean."),
            (user1, "Yes, definitely. Looking forward to more features!"),
        ]

        for sender, content in messages_data:
            Message.objects.create(
                conversation=conversation,
                sender=sender,
                content=content,
                is_read=False
            )

        self.stdout.write(self.style.SUCCESS(f'Created {len(messages_data)} sample messages'))

        # Create another conversation if we have more users
        if users.count() >= 3:
            user3 = users[2]

            self.stdout.write(f'Creating conversation between {user1.email} and {user3.email}')

            conversation2 = Conversation.objects.filter(
                participants=user1
            ).filter(
                participants=user3
            ).filter(
                is_active=True
            ).first()

            if not conversation2:
                conversation2 = Conversation.objects.create()
                conversation2.participants.add(user1, user3)

            # Add a message to this conversation
            Message.objects.create(
                conversation=conversation2,
                sender=user1,
                content="Hey! Welcome to the platform!",
                is_read=False
            )

            self.stdout.write(self.style.SUCCESS(f'Created conversation {conversation2.id} with 1 message'))

        self.stdout.write(
            self.style.SUCCESS('Chat data seeding completed successfully!')
        )
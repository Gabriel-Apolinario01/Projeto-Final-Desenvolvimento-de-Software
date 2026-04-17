from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, LearningPath, Step, SubStep


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'course', 'experience_level', 'is_staff')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informações Adicionais', {'fields': ('course', 'experience_level')}),
    )


@admin.register(SubStep)
class SubStepAdmin(admin.ModelAdmin):
    list_display = ('topic', 'link')


@admin.register(Step)
class StepAdmin(admin.ModelAdmin):
    list_display = ('title', 'learning_path', 'order', 'completed')
    list_filter = ('completed',)
    filter_horizontal = ('sub_steps',)


@admin.register(LearningPath)
class LearningPathAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'category', 'difficulty', 'progress', 'created_at')
    list_filter = ('category', 'difficulty', 'created_at')
    readonly_fields = ('created_at', 'updated_at')

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ServicePriceType;
use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ServiceController extends Controller
{
    private const CATEGORY_INDIVIDUALS = 'Физические лица';

    private const CATEGORY_BUSINESS = 'Бизнес';

    public function meta(): JsonResponse
    {
        $priceTypes = [];
        foreach (ServicePriceType::cases() as $case) {
            $priceTypes[] = [
                'value' => $case->value,
                'label' => $case->label(),
            ];
        }

        return response()->json([
            'categories' => [
                self::CATEGORY_INDIVIDUALS,
                self::CATEGORY_BUSINESS,
            ],
            'price_types' => $priceTypes,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $q = Service::query()
            ->orderByDesc('is_popular')
            ->orderBy('category')
            ->orderBy('name');

        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $like = '%'.$search.'%';
            $q->where(function ($qq) use ($like) {
                $qq->where('name', 'like', $like)
                    ->orWhere('short_description', 'like', $like)
                    ->orWhere('full_description', 'like', $like);
            });
        }

        $category = $request->query('category');
        if (is_string($category) && $category !== '') {
            $q->where('category', $category);
        }

        return response()->json(['data' => $q->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validatedPayload($request);
        $service = Service::create($payload);

        return response()->json(['data' => $service->fresh()], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $service = Service::query()->findOrFail($id);
        $payload = $this->validatedPayload($request);
        $service->fill($payload);
        $service->save();

        return response()->json(['data' => $service->fresh()]);
    }

    public function destroy(int $id): JsonResponse
    {
        $service = Service::query()->findOrFail($id);
        $service->delete();

        return response()->json(['message' => 'Услуга удалена.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedPayload(Request $request): array
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_description' => 'nullable|string',
            'full_description' => 'nullable|string',
            'category' => ['required', 'string', Rule::in([self::CATEGORY_INDIVIDUALS, self::CATEGORY_BUSINESS])],
            'price_type' => ['required', 'string', Rule::enum(ServicePriceType::class)],
            'price_from' => 'nullable|integer|min:0',
            'price_to' => 'nullable|integer|min:0',
            'is_popular' => 'sometimes|boolean',
        ], [
            'name.required' => 'Укажите название услуги.',
            'category.required' => 'Выберите категорию.',
            'price_type.required' => 'Выберите тип цены.',
        ]);

        $type = ServicePriceType::from($validated['price_type']);
        $priceFrom = array_key_exists('price_from', $validated) && $validated['price_from'] !== null
            ? (int) $validated['price_from']
            : null;
        $priceTo = array_key_exists('price_to', $validated) && $validated['price_to'] !== null
            ? (int) $validated['price_to']
            : null;

        if ($type === ServicePriceType::Fixed || $type === ServicePriceType::From) {
            if ($priceFrom === null) {
                throw ValidationException::withMessages([
                    'price_from' => 'Укажите сумму в рублях.',
                ]);
            }
            $priceTo = null;
        }

        if ($type === ServicePriceType::Range) {
            if ($priceFrom === null || $priceTo === null) {
                throw ValidationException::withMessages([
                    'price_from' => 'Укажите суммы «от» и «до» для диапазона.',
                ]);
            }
            if ($priceTo < $priceFrom) {
                throw ValidationException::withMessages([
                    'price_to' => 'Верхняя граница не может быть меньше нижней.',
                ]);
            }
        }

        if ($type === ServicePriceType::Custom) {
            $priceFrom = null;
            $priceTo = null;
        }

        $short = isset($validated['short_description']) ? trim((string) $validated['short_description']) : '';
        $full = isset($validated['full_description']) ? trim((string) $validated['full_description']) : '';

        return [
            'name' => trim($validated['name']),
            'short_description' => $short !== '' ? $short : null,
            'full_description' => $full !== '' ? $full : null,
            'category' => $validated['category'],
            'price_type' => $type,
            'price_from' => $priceFrom,
            'price_to' => $priceTo,
            'is_popular' => (bool) ($validated['is_popular'] ?? false),
        ];
    }
}
